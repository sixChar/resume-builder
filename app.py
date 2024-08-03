import sqlite3

import bcrypt

import click
from flask import Flask, render_template, current_app, g, request
from flask.ext.login import LoginMananger, login_user


app = Flask(__name__)

login_manager = LoginManager()
login_manager.init_app(app)

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


@app.route("/")
def root():
    return render_template("resume.html")

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
        return {"status": "Passwords don't match!"}, 422
    else:
        pHash =  bcrypt.hashpw(bytes(password, "utf-8"), bcrypt.gensalt())

        curr = db.execute("INSERT INTO users (email, pHash) VALUES (?, ?);", [email, pHash])
        rv = curr.fetchall()
        curr.close()
        db.commit()
        return {"status": "success"}, 200

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/api/login", methods=["POST"])
def api_login():
    db = get_db()

    email = request.form['email']
    password = request.form['password']

    curr = db.execute("SELECT pHash FROM users WHERE email='?';", [email])
    rv = curr.fetchall()
    curr.close()
    
    
app.cli.add_command(init_db_command)
    
    

    
