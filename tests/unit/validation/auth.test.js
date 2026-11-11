const {describe, test} = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister } = require('../../../src/validation/auth');

const valid = { username: 'andrew', email: 'aliu3203@gmail.com', password: '12345678'};

describe('validateRegister', () => {

    test('returns null with valid register field', () => {
        assert.equal(validateRegister(valid), null);
    });

    describe('accept boundary values', () => {

    });

});
