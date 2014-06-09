# Flui

Flui is an async flow control for Node and browsers which uses event or queue approach. With Flui you can completely avoid callback hell. With events, each action is loosely coupled to others so it allows you to compose them very flexibly. Queue approach is more straightforward and it allows you to write asynchronous code similar to synchronous way. Enough talking, let's see an example.

## Examples

### Events

Imagine you want to implement simple CRON in Node. Our script will execute all files in our directory tree in an interval. We won't check if the file is executable because it is unnecessary for our purpose.

#### Traditional way

```js
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var flui = require('flui');

var dir = 'path/to';

setInterval(function () {
    fs.readdir(dir, function (err, files) {
        if (err) console.log(err);
        
        files.forEach(function (file) {
            fs.stat(path.join(dir, file), function (err, stats) {
                if (err) console.log(err);
            
                if (stats.isFile()) {
                    spawn(path.join(dir, file));
                }
            });
        });
    });
}, 60 * 60 * 1000);
```

#### Flui way

```js
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var flui = require('flui');
var context = flui.context();

var dir = 'path/to';

setInterval(context.then('tick'), 60 * 60 * 1000);

context.on('tick', function () {
    fs.readdir(dir, context.then('files'));
});

context.on('files', function (err, files) {
    if (err) context.trigger('error', err);
    files.forEach(context.then('file'));
});

context.on('file', function (file) {
    fs.stat(path.join(dir, file), function (err, stats) {
        context.trigger('stats', err, stats, file)
    });
});

context.on('stats', function (err, stats, file) {
    if (err) context.trigger('error', err);
    if (stats.isFile()) {
        spawn(path.join(dir, file));
    }
});

context.on('error', function (err) {
    //one error hadler for all errors
    console.log(err);
});
```

### Queue

Queue is useful for sequence of asynchronous operations. Assume you want to write method to authenticate a user.

#### Traditional way

```js
var db = require('db');
var bcrypt = require('bcrypt');

var flui = require('flui');

db.
model('users').
findOne(req.param('username')).
exec(function (err, user) {
    if (err) res.send(err);
    
    if (user) {
        bcrypt.compare(req.param('password'), user.password, function (err, valid) {
            if (err) res.send(err);
            
            if (valid) {
                user.online = true;
                
                user.save(function (err, user) {
                    req.session.auth = true;
                    res.send(user);
                });
            }
        }
    }
});
```

#### Flui way

```js
var db = require('db');
var bcrypt = require('bcrypt');

var flui = require('flui');

var queue = flui.queue([
    function (username) {
        db.
        model('users').
        findOne(username).
        exec(queue.wait());
    },
    function (err, user) {
        if (err) throw err;
        
        if (user) {
            bcrypt.compare(req.param('password'), user.password, function (err, valid) {
                if (err) queue.raiseError(err);
                queue.next(valid, user);
            });
        }
    },
    function (valid, user) {        
        if (valid) {
            user.online = true;
            user.save(queue.wait());
        }
    },
    function (err, user) {
        req.session.auth = true;
        res.send(user);
    }
]).
error(function (err) {
    //one handler for all errors
    res.send(err);
}).
run(req.param('username'));
```

### Custom eventable library

#### Definition

```js
function UserService(url) {
    this.url = url;
    this.session = {};

    var self = this;

    this.on('_login', function (result) {
        if (result.error) self.trigger(['login:error', 'error'], result.error);
        else {
            self.trigger(['login:success', 'success'], result);
            self.session = result;

            socket.subscribe(result.id, self.then('_subscription'));
        }
    });
    
    this.on('_subscription', function (subscription) {
        subscription.onMessage('logout', self.then('_logout'));
        subscription.onMessage('friend:online', self.then('friend:online'));
        subscription.onMessage('friend:offline', self.then('friend:offline'));
    });
    
    this.on('_logout', function (user) {
        socket.unsubscribe(user.id);
        self.session = {};
        self.trigger(['logout:success', 'success'], user);
    });
}

UserService.prototype.login = function (credentials) {
    http.post(this.url + '/login', credentials, this.then('_login'));
};

UserService.prototype.logout = function () {
    http.post(this.url + '/logout', this.then('_logout'));
};

//extend service
flui.eventable(UserService);
```

#### Usage

```js
var user = new UserService('/api/users');

//profile component
user.on('login:success', function (user) {
    //display user info
});

//storage component
user.on('login:success', function (user) {
    //set user into session storage
});

//flash component
user.on('login:error', function (error) {
    //display error message
});

user.on('logout:success', function () {
    //display logout message
});

//chat messages component
user.on('friend:online', function (friend) {
    //add friend to collection
});

user.on('friend:offline', function (friend) {
    //remove friend from collection
});
```

## Installation

### Node

```bash
npm install flui
```

### Browser

```html
<script type="text/javascript" src="path/to/flui.js"></script>
```

## API

### flui.context()

Creates new event context. You can bind and trigger events on it.

* __on__ (_event_, _callback_) - binds a listener to given event
* __trigger__ (_event_, _[args...]_) - triggers the event and pass given arguments to listeners
* __then__ (_event_) - returns a function which triggers given event immidiately it will be executed (arguments are also passed)

### flui.queue(actions)

Creates a queue of actions which will be executed in diven order. It also allows to add actions later or stop the execution.

* __next__ (_[args...]_) - invokes next action in queue and passed given arguments
* __wait__ () - returns a function which invokes next action immidiately it will be executed (arguments are also passed)
* __run__ (_[args...]_) - starts the execution and passes arguments into first action
* __stop__ () - stops the execution
* __error__ (_callback_) - given callback will be called when an error occurs (there could be at most one listener)
* __raiseError__ (_error_) - raises an error on queue when throw statement couldn't be used (in asynchronous operations)

### flui.eventable(toExtend)

Extends given object/class to bind and trigger events on it. It will get the same API as in `flui.context()`. The argument could be object, instance of function or function (class).

## License

Flui is MIT licensed. Feel free to use it, contribute or spread the word. Created with love by Petr Nevyhoštěný ([Twitter](https://twitter.com/pnevyk)).