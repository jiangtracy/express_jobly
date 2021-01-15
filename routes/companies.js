'use strict';

/** Routes for companies. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn,
				ensureIsAdmin } = require('../middleware/auth');
const Company = require('../models/company');

const companyNewSchema = require('../schemas/companyNew.json');
const companyFilterSchema = require('../schemas/companyFilter.json');
const companyUpdateSchema = require('../schemas/companyUpdate.json');
const e = require('express');

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post('/', ensureIsAdmin, async function(req, res, next) {
	const validator = jsonschema.validate(req.body, companyNewSchema);
	if (!validator.valid) {
		const errs = validator.errors.map((e) => e.stack);
		throw new BadRequestError(errs);
	}

	const company = await Company.create(req.body);
	return res.status(201).json({ company });
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Optional filters provided in query string:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function(req, res, next) {
	
	const q = {...req.query};

	if (q.minEmployees) {
		q.minEmployees = Number(q.minEmployees);
	}

	if (q.maxEmployees) {
		q.maxEmployees = Number(q.maxEmployees);
	}

	const validator = jsonschema.validate(q, companyFilterSchema);
	if (!validator.valid) {
		const errs = validator.errors.map( e => e.stack);
		throw new BadRequestError(errs);
	}

	const companies = await Company.findAll(q);

	return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get('/:handle', async function(req, res, next) {
	const company = await Company.get(req.params.handle);
	return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch('/:handle', ensureIsAdmin, async function(req, res, next) {
	const validator = jsonschema.validate(req.body, companyUpdateSchema);
	if (!validator.valid) {
		const errs = validator.errors.map((e) => e.stack);
		throw new BadRequestError(errs);
	}

	const company = await Company.update(req.params.handle, req.body);
	return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete('/:handle', ensureIsAdmin, async function(req, res, next) {
	await Company.remove(req.params.handle);
	return res.json({ deleted: req.params.handle });
});

module.exports = router;
