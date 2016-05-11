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
        console.log("Object: " + findObject(cmd.entity.object, state));

        var objects : string[] = Array.prototype.concat.apply([], state.stacks);
        var a : string = objects[Math.floor(Math.random() * objects.length)];
        var b : string = objects[Math.floor(Math.random() * objects.length)];
        /*var interpretation : DNFFormula = [[
            {polarity: true, relation: "ontop", args: [a, "floor"]},
            {polarity: true, relation: "holding", args: [b]}
        ]];*/
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

        console.log(cmd);
        console.log(state);
        console.log("________");
        var entities = findEntityID(cmd.entity.object, state);
        console.log('Found number entities: ' + entities);
        console.log("________");
        var interpretation : DNFFormula = [];

        if (cmd.location) {
          console.log('Location found');
          var locationEntities = findEntityID(cmd.location.entity, state);
          if(cmd.location.relation == 'inside'){
            for(var i = 0; i < locationEntities.length; i++){
              for(var j = 0; j < entities.length; j++){
                if(checkBallInBox(state.objects[entities[j]], state.objects[locationEntities[i]])){
                  interpretation.push([{polarity: true, relation: "inside", args: [entities[j], locationEntities[i]]}]);
                }
              }
            }
          }
          if(cmd.location.relation == 'ontop'){
            for(var i = 0; i < entities.length; i++){
              for(var j = 0; j < locationEntities.length; j++){
                if(state.objects[entities[i]].form != 'ball'){
                  interpretation.push([{polarity: true, relation: "ontop", args: [entities[i], locationEntities[j]]}]);
                }
              }
            }
          }
          console.log('Location entities: ' + locationEntities);
        } else {
          for(var i = 0; i < entities.length; i++){
            interpretation.push([{polarity: true, relation: "holding", args: [entities[i]]}]);
          }
        }

        // var command = cmd.command;
        // var entityID = findEntityID(cmd.entity, state);
        // if (entityID) {
        //     console.log(entityID);
        //     // Find which functions should be applied where
        //     // Call some recursive functions
        //     // Return the results
        // } else {
        //     console.log(entityID);
        //     // Return some sort of error, not possible in this world state
        // }
        console.log("Interpretations: " + interpretation);
        if(interpretation.length == 0){
          return undefined;
        }
        return interpretation; // Remove
    }
    //Check that object1 can be on top of object 2
    //TODO: Need to implement pyramid etc.
    function checkOnTopOf(object1 : string, object2 : string, state : WorldState) : boolean{
      var objects = state.objects;
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
      //Return if object 2 is farmost to the left
      return !(state.stacks[0].indexOf(object2) == -1);

    }
    //Check that object1 can be right of object2
    function checkRightOf(object1 : string, object2 : string, state : WorldState) : boolean{
      return !(state.stacks[state.stacks.length].indexOf(object2));
    }

    function checkBallInBox(ball : ObjectDefinition, box : ObjectDefinition) : boolean{
      if(ball.size == 'large' && box.size != 'large' || ball.size == 'small' && box.size == 'tiny' || ball.size == 'tiny' && box.size == 'tiny'){
        return false;
      }
      return true;
    }

    function findObject(object : Parser.Object, state : WorldState) : string[] {
      //No more recursive objects
      var tmp : string[] = [];
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

    // Will return an array of strings corresponding to the objects that
    // match a given entity, implemented recursively so takes in node as
    // type (could use a wrapper function lol)
    function findEntityID(node : any, state : WorldState) : string[] {

        // Is location
        if (node.entity && node.relation) {
            console.log("location");
            var entity = findEntityID(node.entity, state);

            if (node.relation == "leftof") {
                console.log("- leftof");
                // Return all objects left of the entites
                var distanceFromLeftAllowed = state.stacks.length-1;
                for (let i = distanceFromLeftAllowed; i >= 0; i--) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            distanceFromLeftAllowed = i;
                        }
                    }
                }
                var tmp : string[] = [];
                for (let i = 0; i < distanceFromLeftAllowed; i++) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        tmp.push(state.stacks[i][j]);
                    }
                }
                return tmp;
            } else if (node.relation == "rightof") {
                console.log("- rightof");
                // Return all objects right of the entites
                var distanceFromLeftAllowed = 0;
                for (let i = 0; i < state.stacks.length; i++) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            distanceFromLeftAllowed = i;
                        }
                    }
                }
                var tmp : string[] = [];
                for (let i = distanceFromLeftAllowed; i < state.stacks.length; i++) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        tmp.push(state.stacks[i][j]);
                    }
                }
                return tmp;
            } else if (node.relation == "inside") {
                console.log("- inside");
                // Returns the objects that are inside all the entities

                var tmp : string[] = [];

                // Check so that all entities are boxes
                for (let i = 0; i < entity.length; i++) {
                    for (var key in state.objects) {
                        if (key == entity[i]) {
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
                                tmp.push(state.stacks[i][j]);
                            }
                            boxFound = "";
                        } else {
                            // Check if current object is in our entity, save it if it is
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                boxFound = state.stacks[i][j];
                            }
                        }
                    }
                }
            } else if (node.relation == "ontop") {
                console.log("- ontop");
                // Returns objects directly on top of entity (will not work for more than one entity)
                var tmp : string[] = [];
                if(entity.length != 1) {
                    return tmp;
                }
                for (let i = 0; i < state.stacks.length; i++) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            if (state.stacks[i][j+1]) {
                                tmp.push(state.stacks[i][j+1]);
                            }
                        }
                    }
                }
                return tmp;
            } else if (node.realtion == "under") {
                console.log("- under");
                // Returns objects under (not just directly under) the entites

                var tmp : string[] = [];

                // Checks so that all are in same stack and returns what is under
                for (let i = 0; i < state.stacks.length; i++) {
                    var count = 0;
                    var nbrOfEntities = entity.length;
                    for (let j = state.stacks[i].length-1; j >= 0; j--) {
                        if (nbrOfEntities == count) {
                            // All entities was in this stack, start pushing what objects remain above
                            tmp.push(state.stacks[i][j]);
                        } else {
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                count = count + 1;
                            }
                        }
                    }
                }
                return tmp;
            } else if (node.relation == "beside") {
                console.log("- beside");
                // Return all objects beside the entity

                var tmp : string[] = [];

                var columnsWithEntities : number[] = [];

                // Finds columns which has entities inside them and
                // fills columnsWithEntities accordingly
                for (let i = 0; i < state.stacks.length; i++) {
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            columnsWithEntities.push(i);
                            break;
                        }
                    }
                }

                // Adds the entities in the "allowed" rows
                for (let i = 0; i < state.stacks.length; i++) {
                    if (columnsWithEntities.indexOf(i) >= 0) {
                        for (let j = 0; j < state.stacks[i].length; j++) {
                            tmp.push(state.stacks[i][j]);
                        }
                    }
                }

                return tmp;
            } else if (node.relation == "above") {
                console.log("- above");
                // Returns objects above (not just directly above) the entites

                var tmp : string[] = [];

                // Checks so that all are in same stack and returns what is above
                for (let i = 0; i < state.stacks.length; i++) {
                    var count = 0;
                    var nbrOfEntities = entity.length;
                    for (let j = 0; j < state.stacks[i].length; j++) {
                        if (nbrOfEntities == count) {
                            // All entities was in this stack, start pushing what objects remain above
                            tmp.push(state.stacks[i][j]);
                        } else {
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                count = count + 1;
                            }
                        }
                    }
                }

                return tmp;
            }
        }

        // Is entity
        if (node.quantifier && node.object) {                                   // TODO: What should any / the return?
            console.log("entity");
            if (node.quantifier == "any" || node.quantifier == "the") {
                console.log("- any/the");
                // Returns first value from collection
                return findEntityID(node.object, state);
                //var tmp : string[] = [];
                //tmp.push(findEntityID(node.object, state)[0]);
                //return tmp;
            } else if (node.quantifier == "all") {
                console.log("- all");
                // Returns whole collection
                return findEntityID(node.object, state);
            }
        }

        // Is complex object
        if (node.location && node.object) {
            console.log("complex object");
            return [];
        }

        // Is simple object
        return findObject(node, state);
    }

    function getObjectFromID (id : string, state : WorldState) : ObjectDefinition {
        for (var key in state.objects) {
            if (key == id) {
                return state.objects[key];
            }
        }
        return undefined;
    }
}
