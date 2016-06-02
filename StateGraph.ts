///<reference path="Graph.ts"/>
///<reference path="RelationFunctions.ts"/>

//Graph for states in shrdlite, neighbors are the state after making actions
//d - drop, l - left, r - right, p - pick up

class StateEdge<Node> extends Edge<Node> {
    action: string
}


class StateNode {
    constructor(
      public state : WorldState
    ) {}

    add(state : WorldState) : StateNode {
        return new StateNode(state);
    }

    compareTo(other : StateNode) : number {
      var isSame : boolean = true;
      for(var i = 0; i < other.state.stacks.length; i++){
        for(var j = 0; j < other.state.stacks[i].length; j++){
          if(!this.state.stacks[i][j] || this.state.stacks[i][j] != other.state.stacks[i][j]){
            isSame = false;
          }
        }
      }
      if(this.state.holding != other.state.holding){
        isSame = false;
      }
      if(this.state.arm != other.state.arm){
        isSame = false;
      }
      if(isSame){
        return 0;
      }
      return 1;
    }

    toString() : string {
        return JSON.stringify(this.state);
    }
}

class StateGraph implements Graph<StateNode> {

    constructor(){

    }

    outgoingEdges(node : StateNode) : StateEdge<StateNode>[] {
      //TODO: Probably need to copy the state all the time?
      //All edges
      var edges : StateEdge<StateNode>[] = [];
      var state = node.state;

      //Can go left
      if(state.arm > 0) {
        var stateCpy : WorldState = {stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined};
        for(var i = 0; i < state.stacks.length; i++){
          stateCpy.stacks.push(state.stacks[i].slice());
        }
        stateCpy.holding = state.holding;
        stateCpy.arm = state.arm;
        stateCpy.objects = state.objects;
        stateCpy.examples = state.examples;
        var edge : StateEdge<StateNode> = new StateEdge<StateNode>();
        edge.from = node;
        stateCpy.arm--;
        edge.to = new StateNode(stateCpy);
        edge.cost = 1;
        edge.action = "l";
        edges.push(edge);
      }
      //Can go right
      if(state.arm < state.stacks.length-1){
        var stateCpy : WorldState = {stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined};
        for(var i = 0; i < state.stacks.length; i++){
          stateCpy.stacks.push(state.stacks[i].slice());
        }
        stateCpy.holding = state.holding;
        stateCpy.arm = state.arm;
        stateCpy.objects = state.objects;
        stateCpy.examples = state.examples;
        var edge : StateEdge<StateNode> = new StateEdge<StateNode>();
        edge.from = node;
        stateCpy.arm++;
        edge.to = new StateNode(stateCpy);
        edge.cost = 1;
        edge.action = "r";
        edges.push(edge);
      }
      //Arm is holding, i.e can drop
      if(state.holding && checkOnTopOf(state.holding, state.stacks[state.arm][state.stacks[state.arm].length-1] ?
        state.stacks[state.arm][state.stacks[state.arm].length-1]: 'floor' , state)){
        var stateCpy : WorldState = {stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined};
        for(var i = 0; i < state.stacks.length; i++){
          stateCpy.stacks.push(state.stacks[i].slice());
        }
        stateCpy.holding = state.holding;
        stateCpy.arm = state.arm;
        stateCpy.objects = state.objects;
        stateCpy.examples = state.examples;
        var edge : StateEdge<StateNode> = new StateEdge<StateNode>();
        edge.from = node;
        //Check if drop is possible according to physical laws
        stateCpy.stacks[stateCpy.arm].push(stateCpy.holding);
        stateCpy.holding = null;
        edge.to = new StateNode(stateCpy);
        edge.cost = 1;
        edge.action = "d";
        edges.push(edge);

      }
      //Not holding and object exists in current column
      if(!state.holding && state.stacks[state.arm].length != 0){
        var stateCpy : WorldState = {stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined};
        for(var i = 0; i < state.stacks.length; i++){
          stateCpy.stacks.push(state.stacks[i].slice());
        }
        stateCpy.holding = state.holding;
        stateCpy.arm = state.arm;
        stateCpy.objects = state.objects;
        stateCpy.examples = state.examples;
        var edge : StateEdge<StateNode> = new StateEdge<StateNode>();
        edge.from = node;
        stateCpy.holding = stateCpy.stacks[stateCpy.arm][stateCpy.stacks[stateCpy.arm].length-1];
        stateCpy.stacks[stateCpy.arm].splice(stateCpy.stacks[stateCpy.arm].length-1, 1);
        edge.to = new StateNode(stateCpy);
        edge.cost = 1;
        edge.action = "p";
        edges.push(edge);

      }
        return edges
    }

    compareNodes(a : StateNode, b : StateNode) : number {
      if(a == undefined || b == undefined){
        return 1;
      }
        return a.compareTo(b);
    }

    toString(start? : StateNode, goal? : (n:StateNode) => boolean, path? : StateNode[]) : string {
      return "";
    }
}
