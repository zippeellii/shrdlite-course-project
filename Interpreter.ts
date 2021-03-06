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
    * Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
    *
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
        //Maps a relation to a the correlating phsyics function
        var physicFunctionsMap = new collections.Dictionary<string, Function>();
        physicFunctionsMap.setValue('inside', checkOnTopOf);
        physicFunctionsMap.setValue('above', checkAbove);
        physicFunctionsMap.setValue('under', checkUnder);
        physicFunctionsMap.setValue('leftof', checkLeftOf);
        physicFunctionsMap.setValue('rightof', checkRightOf);
        physicFunctionsMap.setValue('beside', checkBeside);
        physicFunctionsMap.setValue('ontop', checkOnTopOf);

        if(cmd.entity.object.form == 'floor'){
          throw ('Cannot move or hold the floor');
        }

        removeObjectsNotInStacks(state);



        var entityObjects = getNodeObjects(cmd.entity, state);
        var interpretation : DNFFormula = [];
        //If there exists a location of where to put the object(s)
        if (cmd.location) {
          var locationObjects = getNodeObjects(cmd.location.entity, state);
          // Loops over all combinations of the locationObjects and entityObjects
          // If all interpretations in a conjunction are physically possible, we add
          // that conjunction to the interpretation variable
          for(var i = 0; i < locationObjects.length; i++){
              for(var j = 0; j < entityObjects.length; j++){
                  var conjCommands : Literal[] = [];
                  var isPossible = true;
                  for(var k = 0; k < locationObjects[i].length; k++){
                      for(var p = 0; p < entityObjects[j].length; p++){
                          if(physicFunctionsMap.getValue(cmd.location.relation)(entityObjects[j][p], locationObjects[i][k], state)){
                            conjCommands.push({polarity: true, relation: cmd.location.relation, args: [entityObjects[j][p], locationObjects[i][k]]});
                          }
                          else{
                              isPossible = false;
                          }
                      }
                  }
                  if(conjCommands.length != 0 && isPossible){
                    interpretation.push(conjCommands);
                  }
              }
          }
        }
        //No location, must be the "holding" relation
        else{
          for(var i = 0; i < entityObjects.length; i++) {
            if (entityObjects[i].length === 1) {
              for(var j = 0; j < entityObjects[i].length; j++) {
                interpretation.push([{polarity: true, relation: "holding", args: [entityObjects[i][j]]}]);
              }
            }
          }
        }
        if(interpretation.length == 0){
          throw ('Physically impossible');
        }
        return interpretation;
    }

    /**
     * Helper function to convert an object to the string representation used in the WorldState
     * return.
     * @param object The object representation of something in the world
     * @param state The current state of the world.
     * @returns A list of strings corresponding to the things in the WorldState that match the description given by the object
     */
    function findObject(object : Parser.Object, state : WorldState) : string[] {
      var tmp : string[] = [];
      if(object.form == 'floor'){
        tmp.push('floor');
      }
      if(object.object == undefined){
        // For all objects, the matching
        for(var obj in state.objects){
          var other = state.objects[obj];
          if(validForm(object, other.form) && validSize(object, other.size) && validColor(object, other.color)){
            tmp.push(obj);
          }
        }
      }
      return tmp;
    }

    // Checks if the form of the string representation worldObject corresponds to the object given
    function validForm(object : Parser.Object, worldObject : string ) : boolean {
      if(object.form == undefined || object.form == null || object.form == "anyform"){
        return true;
      }
      return object.form == worldObject;
    }

    // Checks if the size of the string representation worldObject corresponds to the object given
    function validSize(object : Parser.Object, worldObject : string) : boolean {
      if(object.size == undefined || object.size == null){
        return true;
      }
      return object.size == worldObject;
    }

    // Checks if the color of the string representation worldObject corresponds to the object given
    function validColor(object : Parser.Object, worldObject : string) : boolean {
      if(object.color == null || object.color == undefined){
        return true;
      }
      return object.color == worldObject;
    }

    // Will return an array of strings that recursively corresponds to the objects of the node
    function getNodeObjects(node : any, state : WorldState) : string[][] {
        // If the node is a location node
        if (node.entity && node.relation) {
            return getLocationObjects(node, state);
        }

        // Is the node is an entity node
        if (node.quantifier && node.object) {
            return getEntityObjects(node, state);
        }

        // If the node is a complex object node
        if (node.location && node.object) {
            return getComplexObject(node, state);
        }

        // If the node is a simple object node
        var tmp : string[][] = [];
        tmp.push(findObject(node, state));

        return tmp;
    }

    // Checks which relation is in the node and calls the appropriate function
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

    // Checks which quantifier is in the entity node, and calls the appropriate function
    function getEntityObjects(node : any, state : WorldState) : string[][] {
        var entity = getNodeObjects(node.object, state);

        if (node.quantifier == "the") {
          // If we have more than one conjunction we need to check that they are
          // all the same, and that they all are length one.
          // Otherwise there is no definite "THE" object
          if(entity.length > 1) {
            var tmpValue = entity[0][0];
            for(let i = 1; i < entity.length; i++){
              if(entity[i].length > 1 || entity[i][0] != tmpValue){
                throw ('Cannot find a specific object for THE request');
              }
              else{
                entity.splice(i,1);
              }
            }
          }
          if (entity.length == 1 && entity[0].length == 1) {
              return entity;
          } else {
              throw ('Need to specify the');
          }
        } else if (node.quantifier == "any") {
            // Returns first value from collection
            var tmp : string[][] = [];

            for (let i = 0; i < entity.length; i++) {
                // For each conjunciton, split it up in disjunctions
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

    // Recursive function for getting a disjunction of conjunctions of objects
    function getComplexObject(node : any, state : WorldState) : string[][] {
        var objects = getNodeObjects(node.object, state);
        var concatObjects : string[] = Array.prototype.concat.apply([], objects);
        var location = getNodeObjects(node.location, state);

        var intersectionObjects : string[][] = [];

        for(let i = 0; i < location.length; i++){
            var innerIntersection : string[] = [];
            for(let j = 0; j < location[i].length; j++){
                if(concatObjects.indexOf(location[i][j]) > -1){
                    innerIntersection.push(location[i][j]);
                }
            }
            if (innerIntersection.length > 0) {
                intersectionObjects.push(innerIntersection);
            }
        }
        return intersectionObjects;
    }

    // This removes all the objects in the state which is not in the stacks in
    // the given world, this needs to be done once in order for all other functions to work
    function removeObjectsNotInStacks(state : WorldState) {
        var objectExists : boolean = false;
        for(var obj in state.objects){
          objectExists = false;
          for(var id in state.stacks){
            if(state.stacks[id].indexOf(obj) > -1 || state.holding == obj){
              objectExists = true;
            }
          }
          if(!objectExists){
            delete state.objects[obj];
          }
        }
    }
}
