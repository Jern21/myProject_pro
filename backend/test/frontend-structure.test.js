'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');

var ROOT = path.join(__dirname, '..', '..');

test('project page delegates business script to external file', function () {
    var html = fs.readFileSync(path.join(ROOT, 'frontend/pages/content/project.html'), 'utf-8');
    var script = fs.readFileSync(path.join(ROOT, 'frontend/js/project-page.js'), 'utf-8');

    assert.match(html, /<script src="\.\.\/\.\.\/js\/project-page\.js"><\/script>/);
    assert.doesNotMatch(html, /function\s+loadProjects\s*\(/);
    assert.match(script, /function\s+loadProjects\s*\(/);
    assert.match(script, /initWhenProjectPageMounted/);
    assert.match(script, /window\.openEditForm/);
});
