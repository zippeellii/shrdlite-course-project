///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="lib/collections.ts"/>
///<reference path="RelationFunctions.ts"/>

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
        var errors : Error[] = [];
        var interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                var result : InterpretationResult = <InterpretationResult>parseresult;
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
        //Maps a relation to a the phsyics function correlating
        var physicFuncionsMap = new collections.Dictionary<string, Function>();
        physicFuncionsMap.setValue('inside', checkOnTopOf);
        physicFuncionsMap.setValue('above', checkAbove);
        physicFuncionsMap.setValue('under', checkUnder);
        physicFuncionsMap.setValue('leftof', checkLeftOf);
        physicFuncionsMap.setValue('rightof', checkRightOf);
        physicFuncionsMap.setValue('beside', checkBeside);
        physicFuncionsMap.setValue('ontop', checkOnTopOf);

        removeObjectsNotInStacks(state);

        var entityObjects = getNodeObjects(cmd.entity.object, state);
        var interpretation : DNFFormula = [];

        if (cmd.location) {
          var locationObjects = getNodeObjects(cmd.location.entity, state);
          for(var i = 0; i < locationObjects.length; i++){
            for(var j = 0; j < locationObjects[i].length; j++){
              for(var k = 0; k < entityObjects.length; k++){
                for(var l = 0; l < entityObjects[k].length; l++){
                  if(physicFuncionsMap.getValue(cmd.location.relation)(entityObjects[k][l], locationObjects[i][j], state)){
                    interpretation.push([{polarity: true, relation: cmd.location.relation, args: [entityObjects[k][l], locationObjects[i][j]]}]);
                  }
                }
              }
            }
          }
        }
        else{
          if(cmd.entity.quantifier == 'any'){
            for(var i = 0; i < entityObjects.length; i++){
              for(var j = 0; j < entityObjects[i].length; j++){
                interpretation.push([{polarity: true, relation: "holding", args: [entityObjects[i][j]]}]);
              }
            }
          }
          else{
            for(var i = 0; i < entityObjects.length; i++){
              var conjCommands : Literal[] = [];
              for(var j = 0; j < entityObjects[i].length; j++){
                conjCommands.push({polarity: true, relation: "holding", args: [entityObjects[i][j]]});
              }
              interpretation.push(conjCommands);
            }
          }
        }
        if(interpretation.length == 0){
          throw new Error('No intepretation found');
        }
        return interpretation;
    }

    function findObject(object : Parser.Object, state : WorldState) : string[] {
      //No more recursive objects
      var tmp : string[] = [];
      if(object.form == 'floor'){
        tmp.push('floor');
      }
      if(object.object == undefined){
        //For all objects, find one matching
        for(var obj in state.objects){
          var other = state.objects[obj];
          if(validForm(object, other.form) && validSize(object, other.size) && validColor(object, other.color)){
            tmp.push(obj);
          }
        }
      }
      return tmp;
    }

    function validForm(object : Parser.Object, worldObject : string ) : boolean {
      if(object.form == undefined || object.form == null || object.form == "anyform"){
        return true;
      }
      return object.form == worldObject;
    }

    function validSize(object : Parser.Object, worldObject : string) : boolean {
      if(object.size == undefined || object.size == null){
        return true;
      }
      return object.size == worldObject;
    }

    function validColor(object : Parser.Object, worldObject : string) : boolean {
      if(object.color == null || object.color == undefined){
        return true;
      }
      return object.color == worldObject;
    }

    // Will return an array of strings that recursively corresponds to the objects of the node
    function getNodeObjects(node : any, state : WorldState) : string[][] {
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
        var tmp : string[][] = [];
        tmp.push(findObject(node, state));
        return tmp;
    }

    function getLocationObjects(node : any, state : WorldState) : string[][] {
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

    function getEntityObjects(node : any, state : WorldState) : string[][] {
        var entity = getNodeObjects(node.object, state);
        if (node.quantifier == "the") {
            if (entity.length == 1 && entity[0].length == 1) {
                return entity;
            } else {
                return [];
            }
        } else if (node.quantifier == "any") {
            // Returns first value from collection
            var tmp : string[][] = [];

            for (let i = 0; i < entity.length; i++) {
                // For each outer list, split it up in ORs
                for (let j = 0; j < entity[i].length; j++) {
                    var innerTmp : string[] = [];
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

    function getComplexObject(node : any, state : WorldState) : string[][] {
        var objects = getNodeObjects(node.object, state);
        var concatObjects : string[] = Array.prototype.concat.apply([], objects);
        var location = getNodeObjects(node.location, state);
        for(let i = 0; i < location.length; i++){
            for(let j = 0; j < location[i].length; j++){
                if(concatObjects.indexOf(location[i][j]) == -1){
                    location[i].splice(j, 1);
                }
            }
        }
        return location;
    }

    function removeObjectsNotInStacks(state : WorldState) {
        // This removes all the objects in the state which is not in the stacks
        var objectExists : boolean = false;
        for(var obj in state.objects){
          objectExists = false;
          for(var id in state.stacks){
            if(state.stacks[id].indexOf(obj) > -1){
              objectExists = true;
            }
          }
          if(!objectExists){
            delete state.objects[obj];
          }
        }
    }
}
