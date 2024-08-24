
CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    pHash BLOB NOT NULL,
    name TEXT,
    streetAddress TEXT,
    city TEXT,
    province TEXT,
    postal TEXT,
    phone TEXT,
    github TEXT,
    degree TEXT,
    university TEXT,
    uniLoc TEXT,
    gpa TEXT
);


CREATE TABLE IF NOT EXISTS projects (
    userId INTEGER NOT NULL,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    projLink TEXT,
    PRIMARY KEY (userId, title),
    FOREIGN KEY(userId) REFERENCES users(userId) 
);


/*
    "Proper" db design would have the skills in their own table and linked with their IDs to avoid 
    dublicating text. However, I don't expect that to save more than a dozen bytes on avg for < 10 skills
    per project, < 20 projects per user, with me being the only user but even with 10000 users we have:
        12 * 10 * 20 * 10000 = 24 MiB extra overhead. In exchange it's simpler to access and the app will
    need to make fewer queries with fewer joins.
*/
CREATE TABLE IF NOT EXISTS projSkills (
    userId INTEGER NOT NULL,
    projTitle INTEGER NOT NULL,
    skill TEXT NOT NULL,
    PRIMARY KEY (userId, projTitle, skill) ON CONFLICT IGNORE,
    FOREIGN KEY(projTitle, userId) REFERENCES projects(userId, title)
);


CREATE TABLE IF NOT EXISTS experience (
    userId INTEGER NOT NULL,
    position TEXT NOT NULL,
    employer TEXT NOT NULL,
    description TEXT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE,
    PRIMARY KEY (userId, position, employer, startDate) ON CONFLICT REPLACE,
    FOREIGN KEY(userId) REFERENCES users(userId)

);
