function getObjectsLeftOf(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        var distanceFromLeftAllowed = state.stacks.length - 1;
        for (var i = distanceFromLeftAllowed; i >= 0; i--) {
            for (var j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromLeftAllowed = i;
                }
            }
        }
        for (var i = 0; i < distanceFromLeftAllowed; i++) {
            for (var j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsRightOf(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        var distanceFromLeftAllowed = 0;
        for (var i = 0; i < state.stacks.length; i++) {
            for (var j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromLeftAllowed = i;
                }
            }
        }
        for (var i = distanceFromLeftAllowed; i < state.stacks.length; i++) {
            for (var j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsInside(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        for (var i = 0; i < entity[k].length; i++) {
            for (var key in state.objects) {
                if (key == entity[k][i]) {
                    if (state.objects[key].form != "box") {
                        return tmp;
                    }
                }
            }
        }
        for (var i = 0; i < state.stacks.length; i++) {
            var boxFound = "";
            for (var j = 0; j < state.stacks[i].length; j++) {
                var object = state.stacks[i][j];
                if (boxFound != "") {
                    if (checkOnTopOf(state.stacks[i][j], boxFound, state)) {
                        innerTmp.push(state.stacks[i][j]);
                    }
                    boxFound = "";
                }
                else {
                    if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                        boxFound = state.stacks[i][j];
                    }
                }
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsOntop(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        if (entity[k].length != 1) {
            continue;
        }
        for (var i = 0; i < state.stacks.length; i++) {
            if (entity[0][0] == 'floor') {
                if (state.stacks[i][0]) {
                    innerTmp.push(state.stacks[i][0]);
                }
            }
            else {
                for (var j = 0; j < state.stacks[i].length; j++) {
                    if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                        if (state.stacks[i][j + 1]) {
                            innerTmp.push(state.stacks[i][j + 1]);
                        }
                    }
                }
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsUnder(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        for (var i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (var j = state.stacks[i].length - 1; j >= 0; j--) {
                if (nbrOfEntities == count) {
                    innerTmp.push(state.stacks[i][j]);
                }
                else {
                    if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                        count = count + 1;
                    }
                }
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsBeside(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        var columnsWithEntities = [];
        for (var i = 0; i < state.stacks.length; i++) {
            for (var j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    columnsWithEntities.push(i);
                    break;
                }
            }
        }
        for (var i = 0; i < state.stacks.length; i++) {
            if (columnsWithEntities.indexOf(i) >= 0) {
                if (i > 0) {
                    for (var j = 0; j < state.stacks[i - 1].length; j++) {
                        innerTmp.push(state.stacks[i - 1][j]);
                    }
                }
                if (i < state.stacks.length - 2) {
                    for (var j = 0; j < state.stacks[i + 1].length; j++) {
                        innerTmp.push(state.stacks[i + 1][j]);
                    }
                }
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
function getObjectsAbove(entity, state) {
    var tmp = [];
    for (var k = 0; k < entity.length; k++) {
        var innerTmp = [];
        for (var i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (var j = 0; j < state.stacks[i].length; j++) {
                if (nbrOfEntities == count) {
                    innerTmp.push(state.stacks[i][j]);
                }
                else {
                    if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                        count = count + 1;
                    }
                }
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}
var checkOnTopOf = function (object1, object2, state) {
    if (object2 == undefined || object1 == undefined) {
        return false;
    }
    var objects = state.objects;
    if (object2 == 'floor') {
        return true;
    }
    if (objects[object1].form == 'ball' && objects[object2].form != 'box') {
        return false;
    }
    if (objects[object2].form == 'ball') {
        return false;
    }
    if (objects[object1].size == 'large' && objects[object2].size == 'small') {
        return false;
    }
    if (objects[object2].form == 'box') {
        if (objects[object1].form == 'pyramid' || objects[object1].form == 'plank' || objects[object1].form == 'box') {
            if (objects[object2].size == 'large' && objects[object2].size == 'large' || objects[object2].size == 'small') {
                return false;
            }
        }
    }
    return true;
};
var checkAbove = function (object1, object2, state) {
    for (var i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object2) != -1) {
            return checkOnTopOf(object1, state.stacks[i][state.stacks[i].length - 1], state);
        }
    }
    return false;
};
var checkUnder = function (object1, object2, state) {
    if (state.objects[object2].form == 'ball') {
        return false;
    }
    return checkAbove(object2, object1, state);
};
var checkBeside = function (object1, object2, state) {
    return object1 != object2;
};
var checkLeftOf = function (object1, object2, state) {
    return !(state.stacks[0].indexOf(object2) > -1) && object1 != object2;
};
var checkRightOf = function (object1, object2, state) {
    return !(state.stacks[state.stacks.length].indexOf(object2) > -1) && object1 != object2;
};