const {describe, test} = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister } = require('../../../src/validation/auth');

describe('validateRegister', () => {
    const valid = { username: 'andrew', email: 'aliu3203@gmail.com', password: '12345678'};

    test('returns null with valid register field', () => {
        assert.equal(validateRegister(valid), null);
    });

    describe('type invariants and missing fields', () => {
        test('no missing usernames', () => {
            assert.equal(validateRegister({ ...valid, username: null }), "username is required");
            assert.equal(validateRegister({ ...valid, username: 12345 }), "username is required");
        });

        test('email non-null', () => {
            assert.equal(validateRegister({ ...valid, email: undefined }), "email is required");
            assert.equal(validateRegister({ ...valid, email: {} }), "email is required");
        });

        test('password is a string', () => {
            assert.equal(validateRegister({ ...valid, password: 1 }), "password is required");
            assert.equal(validateRegister({ ...valid, password: null }), "password is required");
        });
    });

    describe('username length, valid chars', () => {
        test('[3, 30] good', () => {
            assert.equal(validateRegister({ ...valid, username: 'abc' }), null); 
            assert.equal(validateRegister({ ...valid, username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }), null); 
        });

        test('2, 31 is bad', () => {
            const err = "username does not have between 3-30 characters, or contains special characters";
            assert.equal(validateRegister({ ...valid, username: 'ab' }), err);
            assert.equal(validateRegister({ ...valid, username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }), err);
        });

        test('accepts alphanumeric and underscores', () => {
            assert.equal(validateRegister({ ...valid, username: 'User_123' }), null);
        });

        test('rejects disallowed characters', () => {
            const err = "username does not have between 3-30 characters, or contains special characters";
            assert.equal(validateRegister({ ...valid, username: 'user-name' }), err); // hyphen
            assert.equal(validateRegister({ ...valid, username: 'user name' }), err); // whitespace
            assert.equal(validateRegister({ ...valid, username: 'user@cf' }), err);   // symbol
        });
    });

    describe('email validation', () => {
        test('upper bound, 250', () => {
            const maxEmail = 'a@' + 'b'.repeat(244) + '.com';
            assert.equal(maxEmail.length, 250);
            assert.equal(validateRegister({ ...valid, email: maxEmail }), null);
        });

        test('251 fails', () => {
            const overEmail = 'a@' + 'b'.repeat(245) + '.com';
            assert.equal(overEmail.length, 251);
            assert.equal(validateRegister({ ...valid, email: overEmail }), "invalid email");
        });

        test('bad regex', () => {
            const cases = ['plainaddress', 'missingDomain@', '@missingUser.com', 'has space@domain.com'];
            for (const email of cases) {
                assert.equal(validateRegister({ ...valid, email }), "invalid email");
            }
        });
    });

    describe('password validation', () => {
        test('[8, 72] works', () => {
            assert.equal(validateRegister({ ...valid, password: 'p'.repeat(8) }), null);
            assert.equal(validateRegister({ ...valid, password: 'p'.repeat(72) }), null);
        });

        test('7, 73 fails', () => {
            const err = "invalid password (must be between 8 or 72 characters)";
            assert.equal(validateRegister({ ...valid, password: 'p'.repeat(7) }), err);
            assert.equal(validateRegister({ ...valid, password: 'p'.repeat(73) }), err);
        });
    });

});
