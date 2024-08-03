
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
    projId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    projLink TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(userId) 
);


CREATE TABLE IF NOT EXISTS skills (
    skillId INTEGER PRIMARY KEY AUTOINCREMENT,
    skillName TEXT NOT NULL
);



CREATE TABLE IF NOT EXISTS userSkills (
    userId INTEGER NOT NULL,
    skillId INTEGER NOT NULL,
    PRIMARY KEY (userId, skillId),
    FOREIGN KEY(userId) REFERENCES users(userId),
    FOREIGN KEY(skillId) REFERENCES skills(skillId)
);


CREATE TABLE IF NOT EXISTS projSkills (
    projId INTEGER NOT NULL,
    skillId INTEGER NOT NULL,
    PRIMARY KEY (projId, skillId),
    FOREIGN KEY(skillId) REFERENCES skills(skillId),
    FOREIGN KEY(projId) REFERENCES projects(projId)
);
