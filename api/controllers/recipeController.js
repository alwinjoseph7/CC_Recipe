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
const slugify_1 = __importDefault(require("slugify"));
const pool = new pg_1.Pool();
module.exports.recipes_ingredients_get = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows: ingredients } = yield pool.query('SELECT * FROM INGREDIENT');
        res.status(200).json({ ingredients: ingredients.map((el) => el.iname) });
    }
    catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.messsage });
    }
});
module.exports.recipes_filter_recipes_get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    try {
        let where = [];
        if (query.cuisine)
            where.push(`cuisine='${query.cuisine}'`);
        if (query.course)
            where.push(`course='${query.course}'`);
        if (query.maxCook)
            where.push(`cook_time<=${query.maxCook}`);
        if (query.minCook)
            where.push(`cook_time>=${query.minCook}`);
        if (query.minPrep)
            where.push(`prep_time<=${query.minPrep}`);
        if (query.maxPrep)
            where.push(`prep_time>=${query.maxPrep}`);
        if (query.ingredients) {
            const ingredientsList = query.ingredients
                .split(',')
                .map((el) => `'${el}'`);
            where.push(`(uid, rname) in (SELECT DISTINCT uid, rname FROM RECIPE_USES_INGREDIENT WHERE iname IN (${ingredientsList}))`);
        }
        const whereString = where.join(' AND ');
        const sqlQuery = 'SELECT course, cuisine, prep_time, cook_time, uname, uid, instructions, image_url, rname FROM RECIPE JOIN USERS ON uid=slug ' +
            (whereString ? 'WHERE ' + whereString : '');
        const { rows } = yield pool.query(sqlQuery);
        res.status(200).json({ recipes: rows });
    }
    catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});
module.exports.recipes_all_get = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sqlQuery = 'SELECT course, cuisine, prep_time, cook_time, uname, uid, instructions, image_url, rname FROM RECIPE JOIN USERS ON uid=slug';
        const { rows } = yield pool.query(sqlQuery);
        res.status(200).json({ recipes: rows });
    }
    catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});
module.exports.recipes_single_get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, rname } = req.params;
    const uid = (0, slugify_1.default)(user, {
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: true,
    });
    try {
        let sqlQuery = `SELECT DISTINCT * FROM RECIPE WHERE uid='${uid}' AND rname='${rname}'`;
        const { rows: recipes } = yield pool.query(sqlQuery);
        sqlQuery =
            'SELECT DISTINCT * FROM RECIPE_USES_INGREDIENT WHERE rname=$1 AND uid=$2';
        const { rows: ingredients } = yield pool.query(sqlQuery, [rname, uid]);
        sqlQuery = 'SELECT DISTINCT uname FROM USERS WHERE slug=$1';
        const { rows: users } = yield pool.query(sqlQuery, [uid]);
        res
            .status(200)
            .json({ recipe: recipes[0], ingredients, author: users[0].uname });
    }
    catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});
module.exports.recipes_single_delete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rname } = req.body;
    const uid = req.slug;
    try {
        const sqlQuery = `DELETE FROM RECIPE WHERE uid='${uid}' AND rname='${rname}'`;
        yield pool.query(sqlQuery);
        res.sendStatus(200);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});
module.exports.recipes_single_post = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rname, cuisine, course, cookTime, prepTime, instructions, imageUrl, ingredients, } = req.body;
    try {
        const uid = req.slug;
        const sqlQuery = `INSERT INTO RECIPE(rname, uid, cuisine, image_url, course, cook_time, prep_time, instructions) 
VALUES($1, $2, $3, $4,
$5, $6, $7, $8) RETURNING *`;
        const { rows } = yield pool.query(sqlQuery, [
            rname,
            uid,
            cuisine,
            imageUrl,
            course,
            Number(cookTime),
            Number(prepTime),
            instructions,
        ]);
        ingredients.forEach((ingredient) => __awaiter(void 0, void 0, void 0, function* () {
            yield pool.query('INSERT INTO RECIPE_USES_INGREDIENT(iname, amount, uid, rname) VALUES($1,$2,$3,$4)', [ingredient.ingredient, ingredient.amount, uid, rname]);
        }));
        console.log(rows);
        res.status(200).json({ recipe: rows[0] });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});
module.exports.recipes_single_update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rname, cuisine, course, cookTime, prepTime, instructions, imageUrl, ingredients, } = req.body;
    const uid = req.slug;
    try {
        let sqlQuery = `UPDATE RECIPE SET cuisine=$1, image_url=$2, course=$3, cook_time=$4,
prep_time=$5, instructions=$6 WHERE rname=$7 AND uid=$8 RETURNING *`;
        const { rows } = yield pool.query(sqlQuery, [
            cuisine,
            imageUrl,
            course,
            Number(cookTime),
            Number(prepTime),
            instructions,
            rname,
            uid,
        ]);
        sqlQuery = 'DELETE FROM RECIPE_USES_INGREDIENT WHERE rname=$1';
        yield pool.query(sqlQuery, [rname]);
        ingredients.forEach((ingredient) => __awaiter(void 0, void 0, void 0, function* () {
            yield pool.query('INSERT INTO RECIPE_USES_INGREDIENT(iname, amount, uid, rname) VALUES($1,$2,$3,$4)', [ingredient.ingredient, ingredient.amount, uid, rname]);
        }));
        res.status(200).json({ recipe: rows[0] });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});
