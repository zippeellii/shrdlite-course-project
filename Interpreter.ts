///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="lib/collections.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types


    /**
    Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
    * @param parses List of parses produced by the Parser.
    * @param currentState The current state of the world.
    * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
    */
    export function interpret(parses: Parser.ParseResult[], currentState: WorldState): InterpretationResult[] {
        var errors: Error[] = [];
        var interpretations: InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                var result: InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation: DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
    * A Literal represents a relation that is intended to
    * hold among some objects.
    */
    export interface Literal {
        /** Whether this literal asserts the relation should hold
         * (true polarity) or not (false polarity). For example, we
         * can specify that "a" should *not* be on top of "b" by the
         * literal {polarity: false, relation: "ontop", args:
         * ["a","b"]}.
         */
        polarity: boolean;
        /** The name of the relation in question. */
        relation: string;
        /** The arguments to the relation. Usually these will be either objects
         * or special strings such as "floor" or "floor-N" (where N is a column) */
        args: string[];
    }

    export function stringify(result: InterpretationResult): string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit: Literal): string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function. The code here is just a
     * template; you should rewrite this function entirely. In this
     * template, the code produces a dummy interpretation which is not
     * connected to `cmd`, but your version of the function should
     * analyse cmd in order to figure out what interpretation to
     * return.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd: Parser.Command, state: WorldState): DNFFormula {
        let interpretation: DNFFormula = [];
        let checkObject = (obj: Parser.Object) => {
            let potentialObjects: string[] = [];
            // Base case. Check if the basic object exists.

            if (obj.object == null) {
                if (obj.form === "floor") {
                    potentialObjects.push("floor");
                    return potentialObjects;
                }
                for (let stack of state.stacks) {
                    for (let worldObject of stack) {
                        let other = state.objects[worldObject];
                        let sameObj = checkForm(obj, other);
                        if (sameObj) {
                            potentialObjects.push(worldObject);
                        }
                    }
                }
                return potentialObjects;

            }
            else {
                let objects = checkObject(obj.object);
                if (!obj.location) {
                    potentialObjects = objects;
                }
                let relationTo = checkObject(obj.location.entity.object);
                let relation = obj.location.relation;
                // Check pair-wise in objects and relationTo if any is true.
                for (let o of objects) {
                    for (let r of relationTo) {
                        if (relation === "beside") {
                            if (checkIfBeside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                            // if r is beside o
                            // Save o in return-list
                        } else if (relation === "under") {
                            // if(checkIfUnder(o, r, state)){
                            //   potentialObjects.push(o);
                            // }
                        } else if (relation === "above") {
                            if (checkIfAbove(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        } else if (relation === "inside") {
                            if (checkIfInside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        } else if (relation === "ontop") {
                            if (checkIfInside(o, r, state)) {
                                potentialObjects.push(o);
                            }
                        }
                    }
                }

            };
            return potentialObjects;
        };

        console.log("The obj", cmd);
        if (cmd.command === "take") {
            console.log("take!");
            let potentialObjects = checkObject(cmd.entity.object);
            console.log("Potential:", potentialObjects);
            console.log("Potential2:", cmd.entity.object);
            if (cmd.entity.quantifier === "the" || cmd.entity.quantifier === "an" || cmd.entity.quantifier === "any"
                || cmd.entity.quantifier === "a") {
                for (let potentialObject of potentialObjects) {
                    interpretation.push([
                        { polarity: true, relation: "holding", args: [potentialObject] }
                    ]);
                }
            } else {
                // Cant take more than 1 object
                interpretation = [];
            }
            return interpretation;
        }
        else if (cmd.command === "move") {
            console.log("put!")
            let potentialObjects = checkObject(cmd.entity.object);
            console.log("Potential obj:", potentialObjects);
            let potentialLocations = checkObject(cmd.location.entity.object);
            console.log("Potential Loc:", potentialLocations);
            if (cmd.location.relation === "inside") {
                for (let potentialObject of potentialObjects) {
                    for (let potentialLocation of potentialLocations) {
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        let fits: boolean = checkIfFitIn(potentialObject, potentialLocation, state);
                        console.log("fits", fits);
                        if (fits) {
                            let conjunction: Conjunction = [];
                            let literal: Literal = { polarity: true, relation: "inside", args: ["e", "k"] };
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

            } else if (cmd.location.relation === "ontop") {
                for (let potentialObject of potentialObjects) {
                    for (let potentialLocation of potentialLocations) {
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        let canHold: boolean = checkIfCanHold(potentialObject, potentialLocation, state);
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
            } else if (cmd.location.relation === "beside") {
                for (let potentialObject of potentialObjects) {
                    for (let potentialLocation of potentialLocations) {
                        console.log("obj: ", potentialObject);
                        console.log("loc: ", potentialLocation);
                        interpretation.push([
                            { polarity: true, relation: "ontop", args: [potentialObject, "" + potentialLocation] }
                        ]);
                    }
                }
                console.log(interpretation);
                // if (interpretation.length === 0) {
                //   console.log("return null");
                //   return null;
                // }
                return interpretation;
            }
        }

        let objects: string[] = Array.prototype.concat.apply([], state.stacks);
        let a: string = objects[Math.floor(Math.random() * objects.length)];
        let b: string = objects[Math.floor(Math.random() * objects.length)];
        interpretation = [[
            { polarity: true, relation: "ontop", args: [a, "floor"] },
            { polarity: true, relation: "holding", args: [b] }
        ]];
        return interpretation;




    };

    function checkIfFitIn(obj: any, inside: any, state: WorldState): boolean {
        obj = state.objects[obj];
        inside = state.objects[inside];
        console.log("obj, inside", obj, inside);
        //console.log("checkIfFitewfrerrererIn", state);


        if (inside.form !== "box") {
            console.log("not a box");
            return false;
        } else {
            if (inside.size === "small") {
                //    console.log("here");

                if (obj.form === "ball") {
                    return obj.size === "small";
                } else {
                    return false;
                }
            } else if (inside.size === "large") {
                //  console.log("here2");
                if (obj.form === "ball") {
                    //    console.log("large ball large box");
                    return true;
                } else {
                    return obj.size === "small";
                }
            }
        }
        console.log("Shouldnt be here.. ");
        return true;
    }

    function checkIfCanHold(obj: any, on: any, state: WorldState): boolean {
        if (on === "floor") {
            return true;
        }
        obj = state.objects[obj];
        on = state.objects[on];
        console.log("obj, on", obj, on);
        if (on.form === "ball") {
            return false;
        } else if (on.size === "small" && obj.size === "large") {
            return false;
        } else if (obj.form === "box" && on.size === "small" && (on.form === "pyramid" || on.form === "brick")) {
            return false;
        } else if (obj.form === "box" && obj.size === "large" && on.form === "pyramid") {
            return false;
        }
        return true;
    }

    function checkForm(obj: any, other: any): boolean {
        let sameForm: boolean, sameColor: boolean, sameSize: boolean;

        if (obj.form === 'anyform' || obj.form === null) {
            sameForm = true;
        } else {
            sameForm = obj.form === other.form;
        }
        if (obj.color === null) {
            sameColor = true;
        } else {
            sameColor = obj.color === other.color;
        }
        if (obj.size === null) {
            sameSize = true;
        } else {
            sameSize = obj.size === other.size;
        }
        return sameColor && sameSize && sameForm;

    };

    function isInWorld(obj: string, state: WorldState): boolean {
        let inWorld: boolean = false;
        for (let stack of state.stacks) {
            for (let object of stack) {
                if (object === obj) {
                    inWorld = true;
                }
            }
        }
        return inWorld;
    };


    function getObjectCords(obj: any, state: WorldState): any {
        let stacks = state.stacks;
        let objCords: any;
        for (let i = 0; i < stacks.length; i++) {
            for (let j = 0; j < stacks[i].length; j++) {
                if (obj === stacks[i][j]) {
                    return { "x": i, "y": j };
                }
            }
        }
    };

    function checkIfBeside(obj: any, other: any, state: WorldState): any {
        let objCords = getObjectCords(obj, state);
        let otherCords = getObjectCords(other, state);
        return objCords.y === otherCords.y &&
            Math.abs(objCords.x - otherCords.x) === 1;
    };

    function checkIfInside(obj: any, other: any, state: WorldState): any {
        if (other === "floor") {
            return getObjectCords(obj, state).y === 0;
        }
        let objCords = getObjectCords(obj, state);
        console.log("Inside", obj, other);
        let otherCords = getObjectCords(other, state);
        console.log(objCords.x === otherCords.x &&
            objCords.y - otherCords.y === 1);
        return objCords.x === otherCords.x &&
            objCords.y - otherCords.y === 1;
    };

    // Check if obj is above other.
    function checkIfAbove(obj: any, other: any, state: WorldState): any {
        let objCords = getObjectCords(obj, state);
        let otherCords = getObjectCords(other, state);
        return objCords.x === otherCords.x &&
            objCords.y > otherCords.y;
    };



    // var checkBasicObjects = (obj : Parser.Object) => {
    //   // Base case. Check if the basic object exists.
    //   if(object.object == null){
    //     var exists = [];
    //     state.objects.forEach((other) => {
    //       if(obj.size == other.size && obj.location == other.location
    //         && obj.color == other.color){
    //           exists.push({
    //           "name" :
    //           });
    //           // Save obj
    //         }
    //     });
    //     if(!exists){
    //       return exists;
    //     }
    //   }else{
    //     var object = checkBasicObjects(obj.object);
    //     var locationObj = checkBasicObjects(obj.location.entity.object);
    //     if(obj.location.relation == 'beside'){
    //       if(object.y == locationObj.y && object.x - locationObj == 1){
    //         return object;
    //       }
    //     }
    //
    //   }
    //
    //
    // };
    // return interpretation;

}
//Check that object1 can be right of object2
var checkRightOf = function(object1: string, object2: string, state: WorldState): boolean {
    return !(state.stacks[state.stacks.length].indexOf(object2) > -1) && object1 != object2;
}

function findObject(object: Parser.Object, state: WorldState): string[] {
    //No more recursive objects
    var tmp: string[] = [];
    if (object.form == 'floor') {
        tmp.push('floor');
    }
    if (object.object == undefined) {
        //For all objects, find one matching
        for (var obj in state.objects) {
            var other = state.objects[obj];
            if (validForm(object, other.form) && validSize(object, other.size) && validColor(object, other.color)) {
                tmp.push(obj);
            }
        }
    }
    return tmp;
}

function validForm(object: Parser.Object, worldObject: string): boolean {
    if (object.form == undefined || object.form == null || object.form == "anyform") {
        return true;
    }
    return object.form == worldObject;
}

function validSize(object: Parser.Object, worldObject: string): boolean {
    if (object.size == undefined || object.size == null) {
        return true;
    }
    return object.size == worldObject;
}

function validColor(object: Parser.Object, worldObject: string): boolean {
    if (object.color == null || object.color == undefined) {
        return true;
    }
    return object.color == worldObject;
}

// Will return an array of strings that recursively corresponds to the objects of the node
function getNodeObjects(node: any, state: WorldState): string[][] {
    // Is location
    if (node.entity && node.relation) {
        return getLocationObjects(node, state);
    }

    // Is entity
    if (node.quantifier && node.object) {
        return getEntityObjects(node, state);
    }

    // Is complex object
    if (node.location && node.object) {
        return getComplexObject(node, state);
    }

    // Is simple object
    var tmp: string[][] = [];
    tmp.push(findObject(node, state));
    return tmp;
}

function getObjectsLeftOf(entity: string[][], state: WorldState): string[][] {
    // Return all objects left of the entites
    var tmp: string[][] = [];
    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];
        var distanceFromLeftAllowed = state.stacks.length - 1;
        for (let i = distanceFromLeftAllowed; i >= 0; i--) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromLeftAllowed = i;
                }
            }
        }
        for (let i = 0; i < distanceFromLeftAllowed; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}

function getObjectsRightOf(entity: string[][], state: WorldState): string[][] {
    // Return all objects right of the entites
    var tmp: string[][] = [];
    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];
        var distanceFromLeftAllowed = 0;
        for (let i = 0; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromLeftAllowed = i;
                }
            }
        }
        for (let i = distanceFromLeftAllowed; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}

function getObjectsInside(entity: string[][], state: WorldState): string[][] {
    // Returns the objects that are inside all the entities

    var tmp: string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];

        // Check so that all entities are boxes
        for (let i = 0; i < entity[k].length; i++) {
            for (var key in state.objects) {
                if (key == entity[k][i]) {
                    if (state.objects[key].form != "box") {
                        return tmp;
                    }
                }
            }
        }

        // TODO: Right now this only handles one box
        for (let i = 0; i < state.stacks.length; i++) {
            var boxFound = "";
            for (let j = 0; j < state.stacks[i].length; j++) {
                var object = state.stacks[i][j];
                if (boxFound != "") {
                    // Check if item is eligble to fit in the box
                    if (checkOnTopOf(state.stacks[i][j], boxFound, state)) {
                        innerTmp.push(state.stacks[i][j]);
                    }
                    boxFound = "";
                } else {
                    // Check if current object is in our entity, save it if it is
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

function getObjectsOntop(entity: string[][], state: WorldState): string[][] {
    // Returns objects directly on top of entity (will not work for more than one entity)

    var tmp: string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];
        if (entity[k].length != 1) {
            continue;
        }
        for (let i = 0; i < state.stacks.length; i++) {
            if (entity[0][0] == 'floor') {
                if (state.stacks[i][0]) {
                    innerTmp.push(state.stacks[i][0]);
                }
            } else {
                for (let j = 0; j < state.stacks[i].length; j++) {
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

function getObjectsUnder(entity: string[][], state: WorldState): string[][] {
    // Returns objects under (not just directly under) the entites

    var tmp: string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];

        // Checks so that all are in same stack and returns what is under
        for (let i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (let j = state.stacks[i].length - 1; j >= 0; j--) {
                if (nbrOfEntities == count) {
                    // All entities was in this stack, start pushing what objects remain above
                    innerTmp.push(state.stacks[i][j]);
                } else {
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

function getObjectsBeside(entity: string[][], state: WorldState): string[][] {
    // Return all objects beside the entity

    var tmp: string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];

        var columnsWithEntities: number[] = [];

        // Finds columns which has entities inside them and
        // fills columnsWithEntities accordingly
        for (let i = 0; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    columnsWithEntities.push(i);
                    break;
                }
            }
        }

        // Adds the entities in the "allowed" rows
        for (let i = 0; i < state.stacks.length; i++) {
            if (columnsWithEntities.indexOf(i) >= 0) {
                if (i > 0) {
                    for (let j = 0; j < state.stacks[i - 1].length; j++) {
                        innerTmp.push(state.stacks[i - 1][j]);
                    }
                }
                if (i < state.stacks.length - 2) {
                    for (let j = 0; j < state.stacks[i + 1].length; j++) {
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

function getObjectsAbove(entity: string[][], state: WorldState): string[][] {
    // Returns objects above (not just directly above) the entites

    var tmp: string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp: string[] = [];

        // Checks so that all are in same stack and returns what is above
        for (let i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (nbrOfEntities == count) {
                    // All entities was in this stack, start pushing what objects remain above
                    innerTmp.push(state.stacks[i][j]);
                } else {
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

function getLocationObjects(node: any, state: WorldState): string[][] {
    var entity = getNodeObjects(node.entity, state);

    if (node.relation == "leftof") {
        return getObjectsLeftOf(entity, state);
    } else if (node.relation == "rightof") {
        return getObjectsRightOf(entity, state);
    } else if (node.relation == "inside") {
        return getObjectsInside(entity, state);
    } else if (node.relation == "ontop") {
        return getObjectsOntop(entity, state);
    } else if (node.realtion == "under") {
        return getObjectsUnder(entity, state);
    } else if (node.relation == "beside") {
        return getObjectsBeside(entity, state);
    } else if (node.relation == "above") {
        return getObjectsAbove(entity, state);
    }
    return [];
}

function getEntityObjects(node: any, state: WorldState): string[][] {
    var entity = getNodeObjects(node.object, state);
    if (node.quantifier == "the") {
        if (entity.length == 1 && entity[0].length == 1) {
            return entity;
        } else {
            return [];
        }
    } else if (node.quantifier == "any") {
        // Returns first value from collection
        var tmp: string[][] = [];

        for (let i = 0; i < entity.length; i++) {
            // For each outer list, split it up in ORs
            for (let j = 0; j < entity[i].length; j++) {
                var innerTmp: string[] = [];
                innerTmp.push(entity[i][j]);
                tmp.push(innerTmp);
            }
        }
        return tmp;
    } else if (node.quantifier == "all") {
        // Returns whole collection
        return entity;
    }
    return [];
}

function getComplexObject(node: any, state: WorldState): string[][] {
    var objects = getNodeObjects(node.object, state);
    var concatObjects: string[] = Array.prototype.concat.apply([], objects);
    var location = getNodeObjects(node.location, state);
    for (let i = 0; i < location.length; i++) {
        for (let j = 0; j < location[i].length; j++) {
            if (concatObjects.indexOf(location[i][j]) == -1) {
                location[i].splice(j, 1);
            }
        }
    }
    return location;
}

function removeObjectsNotInStacks(state: WorldState) {
    // This removes all the objects in the state which is not in the stacks
    var objectExists: boolean = false;
    for (var obj in state.objects) {
        objectExists = false;
        for (var id in state.stacks) {
            if (state.stacks[id].indexOf(obj) > -1) {
                objectExists = true;
            }
        }
        if (!objectExists) {
            delete state.objects[obj];
        }
    }
}
