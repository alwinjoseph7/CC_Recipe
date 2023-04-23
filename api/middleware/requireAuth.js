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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const pool = new pg_1.Pool();
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // verify user is authenticated
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }
    const token = authorization.split(' ')[1];
    try {
        const { _id } = jsonwebtoken_1.default.verify(token, process.env.SECRET);
        const sqlQuery = 'SELECT * FROM USERS WHERE slug=$1';
        const { rows } = yield pool.query(sqlQuery, [_id]);
        console.log(rows);
        if (rows.length === 1) {
            req.slug = _id;
            next();
        }
        else
            throw Error('Not authorized');
    }
    catch (error) {
        console.log(error.message);
        res.status(401).json({ error: 'Request is not authorized' });
    }
});
module.exports = requireAuth;
