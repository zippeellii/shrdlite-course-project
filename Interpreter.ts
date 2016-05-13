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
        // This returns a dummy interpretation involving two random objects in the world
        var command = cmd.command;
        var entity = cmd.entity;
        var location = cmd.location;

        var tast : boolean = false;
        for(var obj in state.objects){
          tast = false;
          for(var id in state.stacks){
            if(state.stacks[id].indexOf(obj) > -1){
              tast = true;
            }
          }
          if(!tast){
            delete state.objects[obj];
          }
        }

        var entities = getNodeObjects(cmd.entity.object, state);
        var interpretation : DNFFormula = [];

        if (cmd.location) {
          var locationEntities = getNodeObjects(cmd.location.entity, state);
          for(var i = 0; i < locationEntities.length; i++){
            for(var j = 0; j < locationEntities[i].length; j++){
              for(var k = 0; k < entities.length; k++){
                for(var l = 0; l < entities[k].length; l++){
                  if(cmd.location.relation =='inside'){
                    if(checkOnTopOf(entities[k][l],locationEntities[i][j], state)){
                      interpretation.push([{polarity: true, relation: "inside", args: [entities[k][l], locationEntities[i][j]]}]);
                    }
                  }
                  if(cmd.location.relation == 'above'){
                    if(checkAbove(entities[k][l],locationEntities[i][j], state)){
                      interpretation.push([{polarity: true, relation: "above", args: [entities[k][l], locationEntities[i][j]]}]);
                    }
                  }
                  if(cmd.location.relation == 'leftof'){
                    if(checkLeftOf(entities[k][l],locationEntities[i][j], state)){
                      interpretation.push([{polarity: true, relation: "leftof", args: [entities[k][l], locationEntities[i][j]]}]);
                    }
                  }
                  if(cmd.location.relation == 'beside'){
                    if(checkBeside(entities[k][l],locationEntities[i][j], state)){
                      interpretation.push([{polarity: true, relation: "beside", args: [entities[k][l], locationEntities[i][j]]}]);
                    }
                  }
                  if(cmd.location.relation == 'ontop'){
                    if(checkOnTopOf(entities[k][l],locationEntities[i][j], state)){
                      interpretation.push([{polarity: true, relation: "ontop", args: [entities[k][l], locationEntities[i][j]]}]);
                    }
                  }
                }
              }
            }
          }
        }
        else{
          if(cmd.entity.quantifier == 'any'){
            for(var i = 0; i < entities.length; i++){
              for(var j = 0; j < entities[i].length; j++){
                interpretation.push([{polarity: true, relation: "holding", args: [entities[i][j]]}]);
              }
            }
          }
          else{
            for(var i = 0; i < entities.length; i++){
              var conjCommands : Literal[] = [];
              for(var j = 0; j < entities[i].length; j++){
                conjCommands.push({polarity: true, relation: "holding", args: [entities[i][j]]});
              }
              interpretation.push(conjCommands);
            }
          }
        }
        console.log('Stringify literal' + stringifyLiteral(interpretation[0][0]));
        if(interpretation.length == 0){
          return undefined;
        }
        return interpretation;
    }
    //Check that object1 can be on top of object 2
    //TODO: Need to implement pyramid etc.
    function checkOnTopOf(object1 : string, object2 : string, state : WorldState) : boolean {
      if (object2 == undefined || object1 == undefined) {
          return false;
      }
      var objects = state.objects;
      if(object2 == 'floor'){
        return true;
      }
      //A ball cannot be on top of anything other than a box (inside) or the floor
      //TODO: This should check the condition for floor aswell
      if(objects[object1].form == 'ball' && objects[object2].form != 'box'){
        return false;
      }
      //A ball cannot have anything ontop of itself
      if(objects[object2].form == 'ball'){
        return false;
      }
      //A small object cannot support a large object
      if(objects[object1].size == 'large' && objects[object2].size == 'small'){
        return false;
      }
      // A box cannot contain pyrmamids, planks or boxes of the same size
      if(objects[object2].form == 'box'){
        if(objects[object1].form == 'pyramid' || objects[object1].form == 'plank' || objects[object1].form == 'box'){
          if(objects[object2].size == 'large' && objects[object2].size == 'large' || objects[object2].size == 'small'){
            return false;
          }
        }
      }
      return true;
    }
    //Check that object1 can be above object2
    function checkAbove(object1 : string, object2 : string, state : WorldState) : boolean{
      for(let i = 0; i < state.stacks.length; i++){
        if(state.stacks[i].indexOf(object2) != -1){
          return checkOnTopOf(object1, state.stacks[i][state.stacks[i].length-1], state);
        }
      }
      //For now, above need same properties as onTopOf
      return checkOnTopOf(object1, object2, state);
    }
    //Check that object1 can be under object2
    function checkUnder(object1 : string, object2 : string, state : WorldState) : boolean{
      //If one is under the other is above
      return checkAbove(object2, object1, state);
    }
    //Check that object1 can be beside object2
    function checkBeside(object1 : string, object2 : string, state : WorldState) : boolean{
      return true;
    }
    //Check that object1 can be left of object2
    function checkLeftOf(object1 : string, object2 : string, state : WorldState) : boolean{
      return object1!=object2;

    }
    //Check that object1 can be right of object2
    function checkRightOf(object1 : string, object2 : string, state : WorldState) : boolean{
      return !(state.stacks[state.stacks.length].indexOf(object2));
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

    function getObjectsLeftOf(entity : string[][], state : WorldState) : string[][] {
        // Return all objects left of the entites
        var tmp : string[][] = [];
        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];
            var distanceFromLeftAllowed = state.stacks.length-1;
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

    function getObjectsRightOf(entity : string[][], state : WorldState) : string[][] {
        // Return all objects right of the entites
        var tmp : string[][] = [];
        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];
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

    function getObjectsInside(entity : string[][], state : WorldState) : string[][] {
        // Returns the objects that are inside all the entities

        var tmp : string[][] = [];

        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];

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

    function getObjectsOntop(entity : string[][], state : WorldState) : string[][] {
        // Returns objects directly on top of entity (will not work for more than one entity)

        var tmp : string[][] = [];

        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];
            if(entity[k].length != 1) {
                continue;
            }
            for (let i = 0; i < state.stacks.length; i++) {
              if (entity[0][0] == 'floor') {
                  if(state.stacks[i][0]) {
                    innerTmp.push(state.stacks[i][0]);
                  }
              } else {
                for (let j = 0; j < state.stacks[i].length; j++) {
                    if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                        if (state.stacks[i][j+1]) {
                            innerTmp.push(state.stacks[i][j+1]);
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

    function getObjectsUnder(entity : string[][], state : WorldState) : string[][] {
        // Returns objects under (not just directly under) the entites

        var tmp : string[][] = [];

        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];

            // Checks so that all are in same stack and returns what is under
            for (let i = 0; i < state.stacks.length; i++) {
                var count = 0;
                var nbrOfEntities = entity[k].length;
                for (let j = state.stacks[i].length-1; j >= 0; j--) {
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

    function getObjectsBeside(entity : string[][], state : WorldState) : string[][] {
        // Return all objects beside the entity

        var tmp : string[][] = [];

        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];

            var columnsWithEntities : number[] = [];

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
                  for (let j = 0; j < state.stacks[i-1].length; j++) {
                      innerTmp.push(state.stacks[i-1][j]);
                  }
                }
                if (i < state.stacks.length-2) {
                  for (let j = 0; j < state.stacks[i+1].length; j++) {
                      innerTmp.push(state.stacks[i+1][j]);
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

    function getObjectsAbove(entity : string[][], state : WorldState) : string[][] {
        // Returns objects above (not just directly above) the entites

        var tmp : string[][] = [];

        for (let k = 0; k < entity.length; k++) {
            var innerTmp : string[] = [];

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
            console.log("- any/the");
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
            console.log("- all");
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

}
