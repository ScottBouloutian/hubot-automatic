'use strict';

const test = require('tape');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const request = {
    get: sinon.stub()
};
const robot = {
    respond: sinon.spy()
};
const script = proxyquire('../index.js', {
    'request': request
});
const msg = {
    send: sinon.spy()
};
const successBody = {
    results: [
        {
            fuel_level_percent: '42'
        }
    ]
};

function resetSpies() {
    request.get.reset();
    robot.respond.reset();
    msg.send.reset();
}

test('the exported script', t => {
    t.plan(1);
    t.equals(typeof script, 'function', 'should be a function');
    resetSpies();
});

test('not passing a token', t => {
    t.plan(1);
    script(robot);
    t.equals(robot.respond.called, false, 'should not setup the robot listener')
    resetSpies();
});

test('setting up the robot listener', t => {
    t.plan(4);
    process.env.HUBOT_AUTOMATIC_TOKEN = 'token';
    script(robot);
    t.equals(robot.respond.calledOnce, true, 'should be setup once')
    t.equals(robot.respond.args[0].length, 2, 'should call respond with exactly two arguments');
    t.equals(robot.respond.args[0][0] instanceof RegExp, true, 'should teach the robot to respond to a phrase');
    t.equals(typeof robot.respond.args[0][1], 'function', 'should give the robot a function to perform when it hears the phrase');
    resetSpies();
});

test('responding if an operation is in progress', t => {
    t.plan(3);
    process.env.HUBOT_AUTOMATIC_TOKEN = 'token';
    script(robot);
    const handler = robot.respond.args[0][1];
    handler(msg);
    t.equals(msg.send.called, false, 'should not respond immediately after the first call');
    handler(msg);
    t.equals(msg.send.calledOnce, true, 'should respond immediately after the second call');
    t.equals(msg.send.args[0][0], 'Patience is a virtue!', 'should respond informing of an operation in progress');
    resetSpies();
});

test('responding with the fuel level', t => {
    t.plan(4);
    process.env.HUBOT_AUTOMATIC_TOKEN = 'token';
    request.get.callsArgWith(2, null, null, successBody);
    script(robot);
    const handler = robot.respond.args[0][1];
    handler(msg);
    setTimeout(() => {
        t.equals(request.get.calledOnce, true, 'should send a network request');
        t.equals(request.get.args[0][0], 'https://api.automatic.com/vehicle', 'should use the correct endpoint');
        t.deepEquals(request.get.args[0][1], { json: true, headers: { Authorization: 'Bearer token' } }, 'should make the request with the correct options');
        t.equals(msg.send.args[0][0], 'Your fuel level is 42%', 'should respond with the fuel level');
        resetSpies();
    }, 1);
});

test('responding with an error', t => {
    t.plan(1);
    process.env.HUBOT_AUTOMATIC_TOKEN = 'token';
    request.get.callsArgWith(2, 'epic fail', null, null);
    script(robot);
    const handler = robot.respond.args[0][1];
    handler(msg);
    setTimeout(() => {
        t.equals(msg.send.args[0][0], 'There was an error: epic fail', 'should respond with the error');
        resetSpies();
    }, 1);
});
