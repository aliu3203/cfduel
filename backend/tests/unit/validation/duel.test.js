import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { validateHistorySearch } from '../../../src/validation/duel.js';

describe('validateHistorySearch', () => {

    test('no filter applied', () => {
        assert.equal(validateHistorySearch({}),
        null);
    });

    test('valid opponent handle', () => {
        assert.equal(validateHistorySearch({
            oppHandle:'boris_cf'}),
        null);
    });

    test('invalid opponent handle', () => {
        assert.equal(validateHistorySearch({
            oppHandle: 123}),
        'invalid opponent handle');
    });

    test('valid problem number', () => {
        assert.equal(validateHistorySearch({
            problemNum: '1843C'}),
        null);
    });

    test('invalid problem number', () => {
        assert.equal(validateHistorySearch({
            problemNum: 1843}),
        'invalid problem number');
    });

    test('valid date range', () => {
        assert.equal(validateHistorySearch({
            startDate:'2026-11-01',
            endDate: '2026-11-10'
        }),
        null);
    }); 

    test('no end date', () => {
        assert.equal(validateHistorySearch({
            startDate:'2026-11-01'
        }),
        "both start date and end date need to be specified");
    }); 

    test('no start date', () => {
        assert.equal(validateHistorySearch({
            endDate:'2026-11-10'
        }),
        "both start date and end date need to be specified");
    }); 

    test('invalid start date', () => {
        assert.equal(validateHistorySearch({
            startDate: '2026-02-30',
            endDate:'2026-11-10'
        }),
        "invalid date format");
    });
    
    test('invalid end date', () => {
        assert.equal(validateHistorySearch({
            startDate: '2026-02-10',
            endDate:'2026-02-30'
        }),
        "invalid date format");
    });

    test('end date before start date', () => {
        assert.equal(validateHistorySearch({
            startDate: '2026-11-03',
            endDate:'2026-11-01'
        }),
        "start date must not be after end date");
    });

    test('end date equal to', () => {
        assert.equal(validateHistorySearch({
            startDate: '2026-11-03',
            endDate:'2026-11-03'
        }),
        null);
    });
})