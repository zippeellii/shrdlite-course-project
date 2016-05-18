///<reference path="Graph.ts"/>

//Graph for states in shrdlite, neighbors are the state after making actions
//d - drop, l - left, r - right, p - pick up


class StateNode {
    constructor(
      public state : WorldState
    ) {}

    add(state : WorldState) : StateNode {
        return new StateNode(state);
    }

    compareTo(other : GridNode) : number {
        return 1;
    }

    toString() : string {
        return "Hello";
    }
}

class StateGraph implements Graph<StateNode> {

    constructor(){

    }

    outgoingEdges(node : StateNode) : Edge<StateNode>[] {
      //TODO: Probably need to copy the state all the time?
      //All edges
      var edges = [];
      var state = node.state;
      //Can go left
      if(state.arm > 0) {
        var edge = new Edge();
        edge.from = node;
        state.arm--;
        edge.to = state;
        edge.cost = 1;
        edges.push(edge);
      }
      //Can go right
      if(state.arm < state.stacks.length){
        var edge = new Edge();
        edge.from = node;
        state.arm++;
        edge.to = state;
        edge.cost = 1;
        edges.push(edge);
      }
      //Arm is holding, i.e can drop
      if(state.holding){
        var edge = new Edge();
        edge.from = node;
        //Check if drop is possible according to physical laws
        state.stacks[state.arm][state.stacks[state.arm].length] = state.holding;
        state.holding = undefined;
        edge.to = state;
        edges.push(edge);

      }
      //Not holding and object exists in current column
      if(!state.holding && state.stacks[state.arm].length != 0){
        var edge = new Edge();
        edge.from = node;
        state.holding = state.stacks[state.arm][state.stacks[state.arm].length-1];
        delete state.stacks[state.arm][state.stacks[state.arm].length];
        edges.push(edge);

      }
        return edges
    }

    compareNodes(a : StateNode, b : StateNode) : number {
        return 1;
    }

    toString(start? : StateNode, goal? : (n:StateNode) => boolean, path? : StateNode[]) : string {
      return "";
    }
}
