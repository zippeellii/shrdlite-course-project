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
        // var objects : string[] = Array.prototype.concat.apply([], state.stacks);
        // var a : string = objects[Math.floor(Math.random() * objects.length)];
        // var b : string = objects[Math.floor(Math.random() * objects.length)];
        // var interpretation : DNFFormula = [[
        //     {polarity: true, relation: "ontop", args: [a, "floor"]},
        //     {polarity: true, relation: "holding", args: [b]}
        // ]];

        //var interpretation : DNFFormula;
        // var args = [];
        // if(cmd.entity){
        //   if(cmd.entity.quantifier){
        //     if(cmd.entity.quantifier == "the"){
        //       // if world state contains 1 of the entity
        //         // object in args!
        //         if(cmd.location){
        //           if(cmd.location.entity.object)
        //         }
        //       // if world state contains > 1 of the entity
        //       // return ambigous!
        //     }
        //     else if(cmd.entity.quantifier == "any"){}
        //   }
        // }

        if(command.command == "take"){
          var potentialObjects = checkObject(command.entity.object);
          return DNFFormula = [[
            {polarity: true, relation: "holding", args: [potentialObjects[0]]}
          ]];
        }



        var checkObject = (obj: Parser.Object) => {
          // Base case. Check if the basic object exists.
          if(obj.object == null){
            var potentialObjects = [];
            for(var worldObject in state.objects){
              let other = state.objects[worldObject];
              if(obj.size == other.size && obj.location == other.location
                && obj.color == other.color){
                  potentialObjects.push(worldObject);
                }
            }
            return potentialObjects;
          }
          else{
            var objects = checkObject(obj.object);
            var relationTo = checkObject(obj.location.entity.object);
            var potentialObjects = [];
            var relation = obj.location.relation;
            // Check pair-wise in objects and relationTo if any is true.
            for(let o of objects){
              for(let r of relationTo){
                if(relation == "beside"){
                  if(checkIfBeside(o, r, state)){
                    potentialObjects.push(o);
                  }
                  // if r is beside o
                  // Save o in return-list
                }else if(relation == "under"){
                  if(checkIfUnder(o, r, state)){
                    potentialObjects.push(o);
                  }
                }else if(relation == "above"){
                  if(checkIfAbove(o, r, state)){
                    potentialObjects.push(o);
                  }
                }
              }
            }

            };
            return potentialObjects;
          }
        };


        var getObjectCords = (obj, state : WorldState) => {
          var stacks = state.stacks, objCords;
          for(let i = 0; i < stacks.length; i++){
            for(let j = 0; j < stacks[i].length; j++){
              if(obj == stacks[i][j]){
                return {"x" : i, "y" : j};
              }
            }
        };
        var checkIfBeside = (obj, other, state : WorldState) => {
          var objCords = getObjectCords(obj, state);
          var otherCords = getObjectCords(other);
          return objCords.y == otherCords.y &&
            Math.abs(objCords.x - otherCords.x) == 1);
        };
        // Check if obj is above other.
        var checkIfAbove = (obj, other, state : WorldState) => {
          var objCords = getObjectCords(obj, state);
          var otherCords = getObjectCords(other);
          return objCords.x == otherCords.x &&
            objCords.y > otherCords.y;
        };



        var checkBasicObjects = (obj : Parser.Object) => {
          // Base case. Check if the basic object exists.
          if(object.object == null){
            var exists = [];
            state.objects.forEach((other) => {
              if(obj.size == other.size && obj.location == other.location
                && obj.color == other.color){
                  exists.push({
                  "name" :
                  });
                  // Save obj
                }
            });
            if(!exists){
              return exists;
            }
          }else{
            var object = checkBasicObjects(obj.object);
            var locationObj = checkBasicObjects(obj.location.entity.object);
            if(obj.location.relation == 'beside'){
              if(object.y == locationObj.y && object.x - locationObj == 1){
                return object;
              }
            }

          }


        };
        return interpretation;
    };



}
