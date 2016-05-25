var Interpreter;
(function (Interpreter) {
    function interpret(parses, currentState) {
        var errors = [];
        var interpretations = [];
        parses.forEach(function (parseresult) {
            try {
                var result = parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        }
        else {
            throw errors[0];
        }
    }
    Interpreter.interpret = interpret;
    function stringify(result) {
        return result.interpretation.map(function (literals) {
            return literals.map(function (lit) { return stringifyLiteral(lit); }).join(" & ");
        }).join(" | ");
    }
    Interpreter.stringify = stringify;
    function stringifyLiteral(lit) {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }
    Interpreter.stringifyLiteral = stringifyLiteral;
    function interpretCommand(cmd, state) {
        var interpretation = [];
        var checkObject = function (obj) {
            var potentialObjects = [];
            if (obj.object == null) {
                if (obj.form === "floor") {
                    potentialObjects.push("floor");
                    return potentialObjects;
                }
                for (var _i = 0, _a = state.stacks; _i < _a.length; _i++) {
                    var stack = _a[_i];
                    for (var _b = 0, stack_1 = stack; _b < stack_1.length; _b++) {
                        var worldObject = stack_1[_b];
                        var other = state.objects[worldObject];
                        var sameObj = checkForm(obj, other);
                        if (sameObj) {
                            potentialObjects.push(worldObject);
                        }
                    }
                }
                return potentialObjects;
            }
            else {
                var objects_1 = checkObject(obj.object);
                if (!obj.location) {
                    potentialObjects = objects_1;
                }
                var relationTo = checkObject(obj.location.entity.object);
                var relation = obj.location.relation;
                for (var _c = 0, objects_2 = objects_1; _c < objects_2.length; _c++) {
                    var o = objects_2[_c];
                    for (var _d = 0, relationTo_1 = relationTo; _d < relationTo_1.length; _d++) {
                        var r = relationTo_1[_d];
                        if (relation === "beside") {
                            if (checkIfBeside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        }
                        else if (relation === "under") {
                        }
                        else if (relation === "above") {
                            if (checkIfAbove(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        }
                        else if (relation === "inside") {
                            if (checkIfInside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        }
                        else if (relation === "ontop") {
                            if (checkIfInside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        }
                    }
                }
            }
            ;
            return potentialObjects;
        };
        console.log("The obj", cmd);
        if (cmd.command === "take") {
            console.log("take!");
            var potentialObjects = checkObject(cmd.entity.object);
            console.log("Potential:", potentialObjects);
            console.log("Potential2:", cmd.entity.object);
            if (cmd.entity.quantifier === "the" || cmd.entity.quantifier === "an" || cmd.entity.quantifier === "any"
                || cmd.entity.quantifier === "a") {
                for (var _i = 0, potentialObjects_1 = potentialObjects; _i < potentialObjects_1.length; _i++) {
                    var potentialObject = potentialObjects_1[_i];
                    interpretation.push([
                        { polarity: true, relation: "holding", args: [potentialObject] }
                    ]);
                }
            }
            else {
                interpretation = [];
            }
            return interpretation;
        }
        else if (cmd.command === "move") {
            console.log("put!");
            var potentialObjects = checkObject(cmd.entity.object);
            console.log("Potential obj:", potentialObjects);
            var potentialLocations = checkObject(cmd.location.entity.object);
            console.log("Potential Loc:", potentialLocations);
            if (cmd.location.relation === "inside") {
                for (var _a = 0, potentialObjects_2 = potentialObjects; _a < potentialObjects_2.length; _a++) {
                    var potentialObject = potentialObjects_2[_a];
                    for (var _b = 0, potentialLocations_1 = potentialLocations; _b < potentialLocations_1.length; _b++) {
                        var potentialLocation = potentialLocations_1[_b];
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        var fits = checkIfFitIn(potentialObject, potentialLocation, state);
                        console.log("fits", fits);
                        if (fits) {
                            var conjunction = [];
                            var literal = { polarity: true, relation: "inside", args: ["e", "k"] };
                            conjunction.push(literal);
                            interpretation.push(conjunction);
                        }
                    }
                }
                if (interpretation.length === 0) {
                    console.log("return null");
                    return null;
                }
                console.dir(interpretation);
                return interpretation;
            }
            else if (cmd.location.relation === "ontop") {
                for (var _c = 0, potentialObjects_3 = potentialObjects; _c < potentialObjects_3.length; _c++) {
                    var potentialObject = potentialObjects_3[_c];
                    for (var _d = 0, potentialLocations_2 = potentialLocations; _d < potentialLocations_2.length; _d++) {
                        var potentialLocation = potentialLocations_2[_d];
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        var canHold = checkIfCanHold(potentialObject, potentialLocation, state);
                        console.log("canhold", canHold);
                        if (canHold) {
                            interpretation.push([
                                { polarity: true, relation: "ontop", args: [potentialObject, potentialLocation] }
                            ]);
                        }
                    }
                }
                console.dir(interpretation);
                if (interpretation.length === 0) {
                    console.log("return null");
                    return null;
                }
                return interpretation;
            }
            else if (cmd.location.relation === "beside") {
                for (var _e = 0, potentialObjects_4 = potentialObjects; _e < potentialObjects_4.length; _e++) {
                    var potentialObject = potentialObjects_4[_e];
                    for (var _f = 0, potentialLocations_3 = potentialLocations; _f < potentialLocations_3.length; _f++) {
                        var potentialLocation = potentialLocations_3[_f];
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        interpretation.push([
                            { polarity: true, relation: "ontop", args: [potentialObject, "" + potentialLocation] }
                        ]);
                    }
                }
                console.log(interpretation);
                return interpretation;
            }
        }
        var objects = Array.prototype.concat.apply([], state.stacks);
        var a = objects[Math.floor(Math.random() * objects.length)];
        var b = objects[Math.floor(Math.random() * objects.length)];
        interpretation = [[
                { polarity: true, relation: "ontop", args: [a, "floor"] },
                { polarity: true, relation: "holding", args: [b] }
            ]];
        return interpretation;
    }
    ;
    function checkIfFitIn(obj, inside, state) {
        obj = state.objects[obj];
        inside = state.objects[inside];
        console.log("obj, inside", obj, inside);
        if (inside.form !== "box") {
            console.log("not a box");
            return false;
        }
        else {
            if (inside.size === "small") {
                if (obj.form === "ball") {
                    return obj.size === "small";
                }
                else {
                    return false;
                }
            }
            else if (inside.size === "large") {
                if (obj.form === "ball") {
                    return true;
                }
                else {
                    return obj.size === "small";
                }
            }
        }
        console.log("Shouldnt be here.. ");
        return true;
    }
    function checkIfCanHold(obj, on, state) {
        if (on === "floor") {
            return true;
        }
        obj = state.objects[obj];
        on = state.objects[on];
        console.log("obj, on", obj, on);
        if (on.form === "ball") {
            return false;
        }
        else if (on.size === "small" && obj.size === "large") {
            return false;
        }
        else if (obj.form === "box" && on.size === "small" && (on.form === "pyramid" || on.form === "brick")) {
            return false;
        }
        else if (obj.form === "box" && obj.size === "large" && on.form === "pyramid") {
            return false;
        }
        return true;
    }
    function checkForm(obj, other) {
        var sameForm, sameColor, sameSize;
        if (obj.form === 'anyform' || obj.form === null) {
            sameForm = true;
        }
        else {
            sameForm = obj.form === other.form;
        }
        if (obj.color === null) {
            sameColor = true;
        }
        else {
            sameColor = obj.color === other.color;
        }
        if (obj.size === null) {
            sameSize = true;
        }
        else {
            sameSize = obj.size === other.size;
        }
        return sameColor && sameSize && sameForm;
    }
    ;
    function isInWorld(obj, state) {
        var inWorld = false;
        for (var _i = 0, _a = state.stacks; _i < _a.length; _i++) {
            var stack = _a[_i];
            for (var _b = 0, stack_2 = stack; _b < stack_2.length; _b++) {
                var object = stack_2[_b];
                if (object === obj) {
                    inWorld = true;
                }
            }
        }
        return inWorld;
    }
    ;
    function getObjectCords(obj, state) {
        var stacks = state.stacks;
        var objCords;
        for (var i = 0; i < stacks.length; i++) {
            for (var j = 0; j < stacks[i].length; j++) {
                if (obj === stacks[i][j]) {
                    return { "x": i, "y": j };
                }
            }
        }
    }
    ;
    function checkIfBeside(obj, other, state) {
        var objCords = getObjectCords(obj, state);
        var otherCords = getObjectCords(other, state);
        return objCords.y === otherCords.y &&
            Math.abs(objCords.x - otherCords.x) === 1;
    }
    ;
    function checkIfInside(obj, other, state) {
        if (other === "floor") {
            return getObjectCords(obj, state).y === 0;
        }
        var objCords = getObjectCords(obj, state);
        console.log("Inside", obj, other);
        var otherCords = getObjectCords(other, state);
        console.log(objCords.x === otherCords.x &&
            objCords.y - otherCords.y === 1);
        return objCords.x === otherCords.x &&
            objCords.y - otherCords.y === 1;
    }
    ;
    function checkIfAbove(obj, other, state) {
        var objCords = getObjectCords(obj, state);
        var otherCords = getObjectCords(other, state);
        return objCords.x === otherCords.x &&
            objCords.y > otherCords.y;
    }
    ;
})(Interpreter || (Interpreter = {}));
