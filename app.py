import sqlite3

import bcrypt
import jwt
import datetime

import click
from flask import Flask, render_template, current_app, g, request, make_response, jsonify
from functools import wraps

import pdfkit
import os


app = Flask(__name__)

app.config['SECRET_KEY'] = "secret"

DATABASE = './resume-builder.sqlite'


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


def init_db():
    db = get_db()
    
    with current_app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))


@click.command('init-db')
def init_db_command():
    init_db()
    click.echo('Initialized the database schema.')


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def make_user_token(userId):
    token = jwt.encode({'user_id': str(userId), 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, app.config['SECRET_KEY'], algorithm='HS256')
    return token


def read_user_token(token):
    return jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return jsonify({'message': 'token missing'}), 401
        try:
            data = read_user_token(token)
            userId = data['user_id']
            db = get_db()
            curr = db.execute("SELECT userId FROM users WHERE userId=?", [userId])
            user = curr.fetchone()

            if not user:
                return jsonify({'message': 'user does not exist!'}), 401
            
        except Exception as e:
            print(e)
            return jsonify({'message': 'token invalid'}), 401
        return f(data['user_id'], *args, **kwargs)
    return decorated



def query_user_profile(db, userId):
    query = """
        SELECT email, name, streetAddress, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills FROM users WHERE userId=(?)
    """

    curr = db.execute(query, [userId])

    rv = curr.fetchone()
    return rv
    

def query_user_projects(db, userId):
    # TODO test and remove userId from query
    query = """
        SELECT
            p.userId,
            p.title, 
            p.description, 
            p.projLink, 
            GROUP_CONCAT(ps.skill, ', ') AS skills
        FROM
            projects p
        JOIN
            projSkills ps ON p.userId = ps.userId AND p.title = ps.projTitle
        WHERE
            p.userId=(?)
        GROUP BY
            p.userId, p.title, p.description, p.projLink;
    """
    curr = db.execute(query, [userId])

    rv = curr.fetchall()

    projects = [{
        "title": title,
        "desc": desc,
        "link": link,
        "skills": list(skills.split(", "))
    } for (_, title, desc, link, skills) in rv]

    return projects


def query_user_experience(db, userId):
    query = """
        SELECT 
            position,
            employer,
            description,
            startDate, 
            endDate
        FROM experience
        WHERE userId=(?)
    """

    curr = db.execute(query, [userId])

    rv = curr.fetchall()

    experience = [{
        "position": position,
        "employer": employer,
        "description": description,
        "startDate": startDate,
        "endDate": endDate,
    } for (position, employer, description, startDate, endDate) in rv]
    return experience


@app.route("/")
def root():
    return render_template("resume.html")


    


@app.route("/protected")
@token_required
def protected(userId):
    return f"User id is {userId}"


@app.route("/projects")
@token_required
def projects(userId):
    return render_template("projects.html")


@app.route("/experience")
@token_required
def experience(userId):
    return render_template("experience.html")


@app.route("/profile")
@token_required
def profile(userId):
    db = get_db()

    rv = query_user_profile(db, userId)

    rv = ("" if col is None else col for col in rv)
    email, name, streetAddr, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills = rv


    return render_template(
        "profile.html",
        email=email,
        name=name,
        streetAddr=streetAddr,
        city=city,
        province=province,
        postal=postal,
        phone=phone,
        github=github,
        degree=degree,
        university=university,
        uniLoc=uniLoc,
        gpa=gpa,
        proficient=proficientSkills,
        familiar=familiarSkills
    )


@app.route("/api/update-profile", methods=["POST"])
@token_required
def api_update_profile(userId):
    email = request.form["email"]
    name = request.form["name"]
    streetAddr = request.form["streetAddr"]
    city = request.form["city"]
    province = request.form["province"]
    postal = request.form["postal"]
    phone = request.form["phone"]
    github = request.form["github"]
    degree = request.form["degree"]
    university = request.form["university"]
    uniLoc = request.form["uniLoc"]
    gpa = request.form["gpa"]
    proficientSkills = request.form["proficient"]
    familiarSkills = request.form["familiar"]

    query = """
        UPDATE users SET
            email=?,
            name=(?),
            streetAddress=?,
            city=?,
            province=?,
            postal=?,
            phone=?,
            github=?,
            degree=?,
            university=?,
            uniLoc=?,
            gpa=?,
            proficientSkills=?,
            familiarSkills=?
        WHERE userId=?
    """

    db = get_db()
    curr = db.execute(query, [email, name, streetAddr, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills, userId])

    rv = curr.fetchall()
    db.commit()

    return {"message": "success"}, 200


@app.route("/api/delete-profile", methods=["POST"])
@token_required
def api_delete_profile(userId):
    delete_experience = """
        DELETE FROM experience WHERE userId=?
    """

    delete_skills = """
        DELETE FROM projSkills WHERE userId=?
    """

    delete_projects = """
        DELETE FROM projects WHERE userId=?
    """

    delete_user = """
        DELETE FROM users WHERE userId=?
    """

    db = get_db()
    curr = db.execute(delete_experience, [userId])
    curr = db.execute(delete_skills, [userId])
    curr = db.execute(delete_projects, [userId])
    curr = db.execute(delete_user, [userId])
    db.commit()

    return {"message": "success"}, 200


@app.route("/api/experience")
@token_required
def api_experience(userId):
    db = get_db()
    experience = query_user_experience(db, userId)

    return experience


@app.route("/api/set-experience", methods=["POST"])
@token_required
def api_set_experience(userId):
    experience = request.json['experience']

    values = [(userId, e['position'], e['employer'], e['description'], e['startDate'], e['endDate']) for e in experience]

    exp_keys = []
    for _, pos, emp, _, start, _ in values:
        exp_keys.append(pos)
        exp_keys.append(emp)
        exp_keys.append(start)

    insert_exp_query = """
        INSERT INTO experience (userId, position, employer, description, startDate, endDate)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    delete_exp_query = """
        DELETE FROM experience
        WHERE userId = ?
        AND (position, employer, startDate) NOT IN ({})
    """.format(', '.join("(?, ?, ?)" for _ in values))

    db = get_db()
    
    curr = db.executemany(insert_exp_query, values) 

    curr = db.execute(delete_exp_query, [userId] + exp_keys)

    db.commit()



    return experience


@app.route("/api/projects")
@token_required
def api_projects(userId):
    db = get_db()
    projects = query_user_projects(db, userId)
    return jsonify(projects)

@app.route("/api/set-projects", methods=["POST"])
@token_required
def api_set_projects(userId):
    projects = request.json['projects']

    # NOTE innefficient
    values = [(userId, p['title'], p['desc'], p['link']) for p in projects]
    titles = [v[1] for v in values]
    skills = [(userId, p['title'], skill) for p in projects for skill in p['skills']]
    flat_skills = []
    for skill in skills:
        flat_skills.append(skill[1])
        flat_skills.append(skill[2])

    insert_projects_query = """
        INSERT INTO projects (userId, title, description, projLink)
        VALUES (?, ?, ?, ?) 
        ON CONFLICT (userId, title) DO UPDATE SET
            userId = excluded.userId,
            description = excluded.description,
            projLink = excluded.projLink

    """

    insert_skills_query = "INSERT INTO projSkills (userId, projTitle, skill) VALUES (?, ?, ?)"


    delete_skills_query = """
        DELETE FROM projSkills
        WHERE userId = ?
        AND (projTitle, skill) NOT IN ({})
    """.format(', '.join("(?, ?)" for _ in skills))

    delete_proj_query = """
        DELETE FROM projects
        WHERE userId = ?
        AND title NOT IN ({})
    """.format(','.join('?' for _ in projects))

    db = get_db()

    # Insert new projects
    curr = db.executemany(insert_projects_query, values)
    
    # Insert new skills
    curr = db.executemany(insert_skills_query, skills)

    # Delete expired skills
    curr = db.execute(delete_skills_query, [userId] + flat_skills)

    # Delete expired projects
    curr = db.execute(delete_proj_query, [userId] + titles)
    db.commit()

    projects = query_user_projects(db, userId)

    return jsonify(projects)
    

    


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/api/signup", methods=["POST"])
def api_signup():
    db = get_db()

    email = request.form['email']
    password = request.form['password']
    passConf = request.form['passConf']

    if password != passConf:
        return {"message": "Passwords don't match!"}, 422
    else:
        pHash =  bcrypt.hashpw(bytes(password, "utf-8"), bcrypt.gensalt())

        try:
            curr = db.execute("INSERT INTO users (email, pHash) VALUES (?, ?);", [email, pHash])
            rv = curr.fetchone()
            curr.close()
            token = make_user_token(curr.lastrowid)
            resp = make_response(jsonify({"message": "success"}), 200)
            resp.set_cookie('token', token, httponly=True)
            db.commit()
            return resp
        except sqlite3.IntegrityError:
            return{"message": "email taken"}, 409


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/api/login", methods=["POST"])
def api_login():
    db = get_db()

    email = request.form['email']
    password = request.form['password']

    curr = db.execute("SELECT userId, pHash FROM users WHERE email=(?);", [email,])
    rv = curr.fetchone()

    if rv != None:
        userId = rv[0]
        phash = rv[1]
        passBytes = password.encode('utf-8')

        passwordValid = bcrypt.checkpw(passBytes, phash)
        curr.close()
    else:
        return {"message": "not found"}, 401

    if passwordValid:
        token = make_user_token(userId)
        resp = make_response(jsonify({"message": "success"}), 200)
        resp.set_cookie('token', token, httponly=True)
        return resp
    else:
        return {"message": "failed"}, 401

    
@app.route("/resume")
@token_required
def show_resume(userId):
    db = get_db()
    (email, name, streetAddr, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills) = query_user_profile(db, userId)

    projects = query_user_projects(db, userId)

    experience = query_user_experience(db, userId)

    html = render_template("resume.html", 
        email=email,
        name=name,
        streetAddr=streetAddr,
        city=city,
        province=province,
        postal=postal,
        phone=phone,
        github=github,
        degree=degree,
        university=university,
        uniLoc=uniLoc,
        gpa=gpa,
        projects=projects,
        experience=experience,
        proficientSkills=proficientSkills.splitlines(),
        familiarSkills=familiarSkills.splitlines(),
    )

    pdf_options = {
        'enable-local-file-access':"",
        'page-size': "A4",
        'margin-top': '0mm',
        'margin-right': '0mm',
        'margin-bottom': '0mm',
        'margin-left': '0mm',
        'encoding': "UTF-8",
    }

    css = "static/styles/resume.css"

    pdf = pdfkit.from_string(html, os.path.abspath("test.pdf"), css=css, options=pdf_options)
    return make_response(html)


@app.route("/builder")
@token_required
def builder(userId):
    return render_template("builder.html")

@app.route("/api/filtered-resume", methods=["POST"])
@token_required
def filtered_resume(userId):
    selected_projects = request.json.get('selected_projects', [])
    db = get_db()
    (email, name, streetAddr, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills) = query_user_profile(db, userId)

    all_projects = {proj['title']: proj for proj in query_user_projects(db, userId)}

    ordered_projects = [all_projects[title] for title in selected_projects if title in all_projects]

    experience = query_user_experience(db, userId)

    html = render_template("resume.html", 
        email=email,
        name=name,
        streetAddr=streetAddr,
        city=city,
        province=province,
        postal=postal,
        phone=phone,
        github=github,
        degree=degree,
        university=university,
        uniLoc=uniLoc,
        gpa=gpa,
        projects=ordered_projects,
        experience=experience,
        proficientSkills=proficientSkills.splitlines(),
        familiarSkills=familiarSkills.splitlines(),
    )
    return jsonify({"resume_html": html})


@app.route("/download-resume", methods=["POST"])
@token_required
def download_resume(userId):
    selected_projects = request.json.get('selected_projects', [])
    db = get_db()

    # Get all projects in a dictionary for fast lookup
    all_projects = {proj['title']: proj for proj in query_user_projects(db, userId)}
    ordered_projects = [all_projects[title] for title in selected_projects if title in all_projects]

    experience = query_user_experience(db, userId)
    profile_data = query_user_profile(db, userId)
    (email, name, streetAddr, city, province, postal, phone, github, degree, university, uniLoc, gpa, proficientSkills, familiarSkills) = profile_data

    html = render_template("resume.html", 
        email=email,
        name=name,
        streetAddr=streetAddr,
        city=city,
        province=province,
        postal=postal,
        phone=phone,
        github=github,
        degree=degree,
        university=university,
        uniLoc=uniLoc,
        gpa=gpa,
        projects=ordered_projects,  # Use ordered projects
        experience=experience,
        proficientSkills=proficientSkills.splitlines(),
        familiarSkills=familiarSkills.splitlines(),
    )

    pdf_options = {
        'enable-local-file-access': "",
        'page-size': "A4",
        'margin-top': '0mm',
        'margin-right': '0mm',
        'margin-bottom': '0mm',
        'margin-left': '0mm',
        'encoding': "UTF-8",
    }

    css = "static/styles/resume.css"

    # Generate PDF
    pdf = pdfkit.from_string(html, False, css=css, options=pdf_options)

    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=resume.pdf'
    return response

    

    
app.cli.add_command(init_db_command)
    
    

    
