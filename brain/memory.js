var Firebase = require('firebase');

/**
 * The Botkit firebase driver
 *
 * @param {Object} config This must contain a `firebase_uri` property
 * @returns {{teams: {get, save, all}, channels: {get, save, all}, users: {get, save, all}}}
 */
module.exports = function (config) {
    if (!config || !config.firebase_uri) {
        throw new Error('firebase_uri is required.');
    }

    var rootRef = new Firebase(config.firebase_uri),
        teamsRef = rootRef.child('teams'),
        usersRef = rootRef.child('users'),
        channelsRef = rootRef.child('channels'),
        eventsRef = rootRef.child('events'),
        rsvpRef = rootRef.child('rsvp'),
        attendRef = rsvpRef.child('attend'),
        maybeRef = rsvpRef.child('maybe'),
        noAttendRef = rsvpRef.child('noAttend');

    return {
        teams: {
            findBy: findBy(teamsRef),
            findOneBy: findOneBy(teamsRef),
            get: get(teamsRef),
            save: save(teamsRef),
            all: all(teamsRef)
        },
        channels: {
            findBy: findBy(channelsRef),
            findOneBy: findOneBy(channelsRef),
            get: get(channelsRef),
            save: save(channelsRef),
            all: all(channelsRef)
        },
        users: {
            findBy: findBy(usersRef),
            findOneBy: findOneBy(usersRef),
            get: get(usersRef),
            save: save(usersRef),
            all: all(usersRef)
        },
        events: {
            findBy: findBy(eventsRef),
            findOneBy: findOneBy(eventsRef),
            get: get(eventsRef),
            save: save(eventsRef),
            all: all(eventsRef)
        },
        rsvp: {
            findBy: findBy(rsvpRef),
            findOneBy: findOneBy(rsvpRef),
            get: get(rsvpRef),
            save: save(rsvpRef),
            all: all(rsvpRef)
        },
        attend: {
            findBy: findBy(attendRef),
            findOneBy: findOneBy(attendRef),
            get: get(attendRef),
            save: save(attendRef),
            all: all(attendRef)
        },
        maybe: {
            findBy: findBy(maybeRef),
            findOneBy: findOneBy(maybeRef),
            get: get(maybeRef),
            save: save(maybeRef),
            all: all(maybeRef)
        },
        noAttend: {
            findBy: findBy(noAttendRef),
            findOneBy: findOneBy(noAttendRef),
            get: get(noAttendRef),
            save: save(noAttendRef),
            all: all(noAttendRef)
        }
    };
};

/**
 * Given a firebase ref, will return a function that will get a single value by ID
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The get function
 */
function get(firebaseRef) {
    return function (id, cb) {
        firebaseRef.child(id).once('value', success, cb);

        function success(records) {
            cb(null, records.val());
        }
    };
}

/**
 * This function filter the records list of result based on the query parameter.
 *
 * @param Object records
 * @param Map query The query to filter records
 * @returns {Array} The filtered list of records
 */
function filterResultList(records, query)
{
    var results = records.val();

    if (!results) {
        return [];
    }

    var list = [];

    for (var key in results) {
        var match = true;

        for (var attribute in query) {
            var value = query[attribute];

            if (
                typeof results[key] == 'undefined'
                || (typeof results[key]['event_data'][attribute] !== 'undefined' && results[key]['event_data'][attribute] !== value)
            ) {
                match = false;
            }
        }

        if (match) {
            list.push(results[key]);
        }
    }

    return list;
}

/**
 * Given a firebase ref, will return a function that will search all the objects based on a query passed as parameter.
 * This query has to be a map with attribute names as keys and filtered value as values.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The find function
 */
function findBy(firebaseRef) {
    return function (query, cb) {
        firebaseRef.once('value', success, cb);

        function success(records) {
            var list = filterResultList(records, query);

            cb(list);
        }
    };
}

/**
 * Given a firebase ref, will return a function that will search an object based on a query passed as parameter.
 * This query has to be a map with attribute names as keys and filtered value as values.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The find function
 */
function findOneBy(firebaseRef) {
    return function (query, cb) {
        firebaseRef.once('value', success, cb);

        function success(records) {
            var list = filterResultList(records, query);

            cb(null, list[0]);
        }
    };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function save(firebaseRef) {
    return function (data, cb) {
        var firebase_update = {};
        firebase_update[data.id] = data;

        firebaseRef.update(firebase_update, cb);
    };
}

/**
 * Given a firebase ref, will return a function that will return all objects stored.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The all function
 */
function all(firebaseRef) {
    return function (cb) {
        return findBy(firebaseRef)({}, cb);
    };
}