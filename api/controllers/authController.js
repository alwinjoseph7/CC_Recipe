"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const slugify_1 = __importDefault(require("slugify"));
const pool = new pg_1.Pool();
const maxAge = 3 * 24 * 60 * 60;
const createToken = (slug) => {
    return jsonwebtoken_1.default.sign({ _id: slug }, process.env.SECRET, { expiresIn: maxAge });
};
module.exports.user_signup_post = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    // Signup user if doesnt exist, if user exists return error
    try {
        const slug = (0, slugify_1.default)(username, {
            remove: /[*+~.()'"!:@]/g,
            lower: true,
            strict: true
        });
        if (!slug)
            throw Error("Invalid Username");
        const { rows } = yield pool.query('SELECT * FROM USERS WHERE slug=$1', [slug]);
        if (rows.length)
            throw Error("Username Already Taken");
        const values = [username, password, slug];
        const user = yield pool.query('INSERT INTO USERS(uname, pwd, slug) VALUES($1,$2,$3) RETURNING *', values);
        if (!user)
            throw Error("Something went wrong during signup");
        const token = createToken(slug);
        res.status(200).json({ username, token });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
module.exports.user_login_post = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    // Login user if exists, if user doesn't exist return error
    try {
        const slug = (0, slugify_1.default)(username, {
            remove: /[*+~.()'"!:@]/g,
            lower: true,
            strict: true
        });
        if (!slug)
            throw Error("Invalid Username");
        const { rows } = yield pool.query('SELECT * FROM USERS WHERE slug=$1', [slug]);
        if (rows.length === 0)
            throw Error("Username Not Found");
        const user = rows[0];
        if (user.pwd != password || user.uname != username)
            throw Error("Invalid Login or Password");
        const token = createToken(user.slug);
        res.status(200).json({ username: user.uname, token });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
