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
        
        let objectNames = interpretEntity(cmd.entity, state);
        console.log("Object names: " + objectNames.toString());
        
        switch (cmd.command) {
            case "take":
                for (let name of objectNames) {
                    let conjunction: Conjunction = [];
                    let literal: Literal = { polarity: true, relation: 'holding', args: [name] };
                    conjunction.push(literal);
                    interpretation.push(conjunction);
                }
                break;
            case "move":
            case "put":
                let possibleLocations = interpretLocation(cmd.location, state);
                console.log("Locations: " + possibleLocations.possibleObjects.toString());
                
                for (let name of objectNames) {
                    let conjunction: Conjunction = [];
                    
                    for (let location of possibleLocations.possibleObjects) {
                        let literal : Literal = { polarity: true, relation: possibleLocations.relation, args: [name, location] };
                        conjunction.push(literal);
                        interpretation.push(conjunction);
                    }
                }
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
                let worldObject = state.objects[worldObjectName];
                if (checkSimilarity(object, worldObject)) {
                        possibleObjects.push(worldObjectName);
                }
            }
            return possibleObjects;
            
        } else {
            let possibleObjects : string[] = interpretObject(object.object, state);
            let location : Parser.Location = object.location;
            let checkedObjects: string[] = []; 
            for (let uncheckedObject of possibleObjects) {
                let possibleLocations = interpretLocation(location, state);
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

        switch (relation) {
            case 'leftof':
                if (objectCoord.x < relativeObjCoord) {
                    return true;
                }
                break;
            case 'rightof':
                if (objectCoord.x > relativeObjCoord) {
                    return true;
                }
                break;
            case 'inside':
                if (objectCoord.x == relativeObjCoord.x && objectCoord.y - relativeObjCoord.y == 1) {
                    return true;
                }
                break;
            case 'ontop':
                if (objectCoord.x == relativeObjCoord.x && objectCoord.y - relativeObjCoord.y == -1) {
                    return true;
                }
                break;
            case 'under':
                if (objectCoord.x == relativeObjCoord.x && objectCoord.y < relativeObjCoord.y) {
                    return true;
                }
                break;
            case 'above':
                if (objectCoord.x == relativeObjCoord.x && objectCoord.y > relativeObjCoord.y) {
                    return true;
                }
                break;
            case 'beside':
                if (Math.abs(objectCoord.x - relativeObjCoord.x) == 1) {
                    return true;
                }
                break;

        }
        return false;
    }
    
    // function isObjectInLocation(objectName: string, location: Parser.Location, state: WorldState): boolean {
    //     let relation: string = location.relation;
    //     let possibleRelationObjects: string[] = interpretEntity(location.entity, state);
        
    //     let objectCoord = getCoordinates(objectName, state);

    //     for (let relationObject of possibleRelationObjects) {
    //         let relativeObjCoord = getCoordinates(relationObject, state);
            
    //         switch (relation) {
    //             case 'leftof': 
    //                 if (objectCoord.x < relativeObjCoord) {
    //                     return true; // Should it really return true as soon as there is something that fits?
    //                 }
    //                 break;
    //             case 'rightof':
    //                 if (objectCoord.x > relativeObjCoord) {
    //                     return true; // Should it really return true as soon as there is something that fits?
    //                 }
    //                 break;
    //             case 'inside':
    //                 if (objectCoord.x == relativeObjCoord.x && objectCoord.y - relativeObjCoord.y == 1) {
    //                     return true;
    //                 }
    //                 break;
    //             case 'ontop':
    //                 if (objectCoord.x == relativeObjCoord.x && objectCoord.y - relativeObjCoord.y == -1) {
    //                     return true;
    //                 }
    //                 break;
    //             case 'under':
    //                 if (objectCoord.x == relativeObjCoord.x && objectCoord.y < relativeObjCoord.y) {
    //                     return true;
    //                 }
    //                 break;
    //             case 'above':
    //                 if (objectCoord.x == relativeObjCoord.x && objectCoord.y > relativeObjCoord.y) {
    //                     return true;
    //                 }
    //                 break;
    //             case 'beside':
    //                 if (Math.abs(objectCoord.x - relativeObjCoord.x) == 1)  {
    //                     return true;
    //                 }
    //                 break;

    //         }
    //     }
    //     return false;
    // }

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

