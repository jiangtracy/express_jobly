'use strict';

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../expressError');
const { authenticateJWT, ensureLoggedIn, ensureIsAdmin, ensureCorrectUserOrAdmin } = require('./auth');

const { SECRET_KEY } = require('../config');
const testJwt = jwt.sign({ username: 'test', isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: 'test', isAdmin: false }, 'wrong');

describe('authenticateJWT', function() {
	test('works: via header', function() {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${testJwt}` } };
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({
			user: {
				iat: expect.any(Number),
				username: 'test',
				isAdmin: false
			}
		});
	});

	test('works: no header', function() {
		expect.assertions(2);
		const req = {};
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});

	test('works: invalid token', function() {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${badJwt}` } };
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
});

describe('ensureLoggedIn', function() {
	test('works', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: false } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureLoggedIn(req, res, next);
	});

	test('unauth if no login', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: {} };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureLoggedIn(req, res, next);
	});
});

/************************ ensureIsAdmin tests */

describe('ensureIsAdmin', function() {
	test('works', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: true } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureIsAdmin(req, res, next);
	});

	test('unauth if isAdmin is false', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: false } } };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureIsAdmin(req, res, next);
	});

	test('unauth if no user logged in', function() {
		expect.assertions(1);
		const req = {};
		const res = {};
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureIsAdmin(req, res, next);
	});
});

/***************** ensureCorrectUserOrAdmin tests */

describe('ensureCorrectUserOrAdmin', function() {
	test('works: if user is an admin', function() {
		expect.assertions(1);
		const req = {
			params: {
				username: 'u1'
			}
		};
		const res = { locals: { user: { username: 'test', isAdmin: true } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureCorrectUserOrAdmin(req, res, next);
	});

	test('works: if url params matches the logged in username', function() {
		expect.assertions(1);
		const req = {
			params: {
				username: 'u1'
			}
		};
		const res = { locals: { user: { username: 'u1', isAdmin: false } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureCorrectUserOrAdmin(req, res, next);
  });
  
  test('works: if url params matches the logged in username and is admin', function() {
		expect.assertions(1);
		const req = {
			params: {
				username: 'u1'
			}
		};
		const res = { locals: { user: { username: 'u1', isAdmin: true } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureCorrectUserOrAdmin(req, res, next);
	});

	test("fails: if url params doesn't match the logged in username and is not admin", function() {
		expect.assertions(1);
		const req = {
			params: {
				username: 'u2'
			}
		};
		const res = { locals: { user: { username: 'u1', isAdmin: false } } };
		const next = function(err) {
			expect(err).toBeTruthy();
		};
		ensureCorrectUserOrAdmin(req, res, next);
	});
});
