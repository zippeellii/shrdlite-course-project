///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

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
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult[] {
        let errors : Error[] = [];
        let interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                let result : InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch(err) {
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
        interpretation : DNFFormula;
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
        polarity : boolean;
	/** The name of the relation in question. */
        relation : string;
	/** The arguments to the relation. Usually these will be either objects 
     * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result : InterpretationResult) : string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit : Literal) : string {
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
    function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {
        
        let interpretation: DNFFormula = [];
        
        console.log(cmd);

        let objectNames = interpretEntity(cmd.entity, state);
        console.log("Object names: " + objectNames.toString());
        
        switch (cmd.command) {
            case "take":
                for (let name of objectNames) {
                    // if (isFree(name, state)) {
                        let conjunction: Conjunction = [];
                        let literal: Literal = { polarity: true, relation: 'holding', args: [name] };
                        conjunction.push(literal);
                        interpretation.push(conjunction);
                    // }
                }
                break;
            case "move":
                let possibleLocations = interpretLocation(cmd.location, state);
                console.log("Locations: " + possibleLocations.possibleObjects.toString());

                for (let name of objectNames) {
                    for (let location of possibleLocations.possibleObjects) {
                        if (name != location && physicsWork(name, location, possibleLocations.relation, state)) {
                            let conjunction: Conjunction = [];
                            let literal : Literal = { polarity: true, relation: possibleLocations.relation, args: [name, location] };
                            // console.log('literal to add: ' + literal.relation + ' args: ' + literal.args.toString());
                            conjunction.push(literal);
                            interpretation.push(conjunction);
                        }
                    }
                }

                

                // console.log('interlength: ' + interpretation.length);
                // for (let conjunction of interpretation) {
                //     console.log('conjunction length: ' + conjunction.length);
                //     for (let literal of conjunction) {
                //         console.log('literal: ' + literal.args.toString());

                //     }
                // }
                break;
        }

        // This returns a dummy interpretation involving two random objects in the world
        // let objects : string[] = Array.prototype.concat.apply([], state.stacks);
        // let a : string = objects[Math.floor(Math.random() * objects.length)];
        // let b : string = objects[Math.floor(Math.random() * objects.length)];
        // let interpretation : DNFFormula = [[
        //     {polarity: true, relation: "ontop", args: [a, "floor"]},
        //     {polarity: true, relation: "holding", args: [b]}
        // ]];

        // if (interpretation.length == 0) {
        //     return undefined;
        // } else {
        //     return interpretation;
        // }
        return interpretation;
    }

    function interpretEntity(entity : Parser.Entity, state : WorldState) : string[] {
        // let quantifier: string = entity.quantifier;
        let possibleObjects : string[] = interpretObject(entity.object, state);
        return possibleObjects;
    }

    function interpretObject(object : Parser.Object, state : WorldState) : string[] {
        // Base case
        if (!object.object) {
            let possibleObjects : string[] = [];
            for (let worldObjectName in state.objects) {
            if (object.form == 'floor' && possibleObjects.indexOf('floor') == -1) {
                possibleObjects.push("floor");
            } else {
                let allStacks: string[] = Array.prototype.concat.apply([], state.stacks);
                    if (allStacks.indexOf(worldObjectName) != -1) {
                        let worldObject = state.objects[worldObjectName];
                        if (checkSimilarity(object, worldObject)) {
                                possibleObjects.push(worldObjectName);
                        }
                    }
                }
                
            }
            return possibleObjects;

        // Recursive case
        } else {
            let possibleObjects : string[] = interpretObject(object.object, state);
            console.log('pobjs: ' + possibleObjects);
            let location : Parser.Location = object.location;
            let checkedObjects: string[] = []; 
            for (let uncheckedObject of possibleObjects) {
                let possibleLocations = interpretLocation(location, state);
                // console.log('plocats: ' + possibleLocations.possibleObjects.toString());
                for (let possibleRelativeObject of possibleLocations.possibleObjects) {
                    if (isRelationValid(uncheckedObject, possibleRelativeObject, possibleLocations.relation, state)) { // Filter array instead?
                        // console.log('valid relation');
                        checkedObjects.push(uncheckedObject);
                    }
                }
            }
            return checkedObjects;
        }
    }

    function interpretLocation(location: Parser.Location, state: WorldState): any {
        let relation: string = location.relation;
        let possibleObjects: string[] = interpretEntity(location.entity, state);
        let locations = { relation: relation, possibleObjects: possibleObjects };
        return locations;
    }

    function isRelationValid(parsedObject: string, relativeObject : string, relation : string, state: WorldState): boolean {
        let objectCoord = getCoordinates(parsedObject, state);
        let relativeObjCoord = getCoordinates(relativeObject, state);

        // console.log("objco: " + parsedObject + " " + objectCoord.x + " relco: " + relativeObject + " " + relativeObjCoord.x + " relation: " + relation);
        switch (relation) {
            case 'leftof':
                return objectCoord.x < relativeObjCoord.x;
            case 'rightof':
                return objectCoord.x > relativeObjCoord.x;
            case 'inside':
                return fitsIn(parsedObject, relativeObject, state) && 
                    objectCoord.x === relativeObjCoord.x && 
                    objectCoord.y - relativeObjCoord.y === 1;
            case 'ontop':
                if (relativeObject == 'floor') {
                    return objectCoord.y === 0;
                } else if (objectCoord.x === relativeObjCoord.x && objectCoord.y - relativeObjCoord.y === -1) {
                    return true;
                }
                break;
            case 'under':
                return objectCoord.x === relativeObjCoord.x && objectCoord.y < relativeObjCoord.y;
            case 'above':
                return objectCoord.x === relativeObjCoord.x && objectCoord.y > relativeObjCoord.y;
            case 'beside':
                return Math.abs(objectCoord.x - relativeObjCoord.x) === 1;
        }
        return false;
    }

    function physicsWork(object: string, relativeObject : string, relation : string, state : WorldState) : boolean {
        

        switch (relation) {
            case 'leftof':
                return true;
            case 'rightof':
                return true;
            case 'inside':
                return fitsIn(object, relativeObject, state);
            case 'ontop':
                // return fitsIn(object, relativeObject, state);
                // if (getForm(relativeObject, state) === 'ball') {
                //     return false;
                // }
                return true;
            case 'under':
                return true;
            case 'above':
                // return fitsIn(object, relativeObject, state);
                if (getForm(relativeObject, state) === 'ball') {
                    return false;
                }
                return true;
            case 'beside':
                return true;
            default: 
                return true;
        }

    }
    
    function fitsIn(fittingObject : string, receptacleObject : string, state : WorldState) : boolean {
        console.log('Size:' + state.objects[receptacleObject].size);
        if ( getSize(receptacleObject, state) === 'small') {
            return getSize(fittingObject, state) === 'small'
        } else {
            return true;
        }
    }

    function getForm(object : string, state : WorldState) : string {
        return state.objects[object].form;
    }

    function getSize(object: string, state: WorldState): string {
        return state.objects[object].size;
    }    

    function isFree(objectName : string, state : WorldState) : boolean {
        
        let objectCoord = getCoordinates(objectName, state);
        console.log("coord " + objectName + " " + objectCoord.x + " " + objectCoord.y);
        console.log(state.stacks[objectCoord.x].toString());
        let stackSize: number = state.stacks[objectCoord.x].length;
        console.log("ssize: " + stackSize);
        return objectCoord.y == stackSize - 1;
    }

    function checkSimilarity(parseObject : Parser.Object, worldObject : Parser.Object) : boolean {
        let sameForm: boolean, sameColor: boolean, sameSize: boolean;

        if (parseObject.form == 'anyform') {
            sameForm = true;
        } else {
            sameForm = parseObject.form == worldObject.form;
        }
        if (parseObject.color) {
            sameColor = parseObject.color == worldObject.color;
        } else {
            sameColor = true;
        }
        if (parseObject.size) {
            sameSize = parseObject.size == worldObject.size;
        } else {
            sameSize = true; 
        }

        return sameForm && sameColor && sameSize;
    }

    function getCoordinates(objectName : string, state : WorldState) : any {
        
        for (let x=0; x < state.stacks.length; x++) {
            for (let y = 0; y < state.stacks[x].length; y++) {
                if (state.stacks[x][y] == objectName) {
                    return { x:x, y:y };
                }
            }
        }
    }

}

