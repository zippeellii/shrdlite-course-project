///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    /** The path (sequence of Nodes) found by the search algorithm. */
    path : Node[];
    /** The total cost of the path. */
    cost : number;
    /** The number of nodes processed to find the goal*/
    steps: number;
}

/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
    var steps = 0;
    var time = new Date().getTime();
    //Initial setup
    var processed = new collections.Set<Node>();
    //Store the path, i.e what parent that has the shortest path for me
    var bestParent = new collections.Dictionary<Node, Node>();
    bestParent.setValue(start, undefined);
    //Cost to get to a specific node from the start node, start to start is 0
    var gCost = new collections.Dictionary<Node,number>();
    gCost.setValue(start, 0);
    //PriorityQueue to handle which is supposed to be closest atm
    var nextToVisit = new collections.PriorityQueue<Node>(
      function(firstNode: Node, secondNode: Node) : number {
        var firstValue = gCost.getValue(firstNode) + heuristics(firstNode);
        var secondValue = gCost.getValue(secondNode) + heuristics(secondNode);
        if(firstValue < secondValue){
          return 1;
        }
        else if(firstValue == secondValue){
          return 0;
        }
        else{
          return -1;
        }
      });
    nextToVisit.add(start);

    //Whenever there is a new node to visit, do it
    while (!nextToVisit.isEmpty()){
        if(new Date().getTime() - time > timeout){
            throw ('Timeout');
        }
      var currentNode = nextToVisit.dequeue();
      steps++;
      if(goal(currentNode)){
        var pathNode = currentNode;
        var path = new Array();
        //Find the entire path
        while(bestParent.getValue(pathNode) != undefined){
          path.push(pathNode);
          pathNode = bestParent.getValue(pathNode);
        }
        //Reverse path to match expected output
        path.reverse();
        var result : SearchResult<Node> = {
            path: path,
            cost: gCost.getValue(currentNode),
            steps: steps
        };
        return result;

      }
      processed.add(currentNode);
      var edges = graph.outgoingEdges(currentNode);
      for(var edge of edges){
        if(processed.contains(edge.to)) continue;

        var neighbour = edge.to;
        if(gCost.getValue(neighbour) == undefined || gCost.getValue(neighbour) > gCost.getValue(edge.from) + edge.cost){
          //New gValue is what cost to parent + edge
          gCost.setValue(neighbour, edge.cost + gCost.getValue(edge.from));
          //Add as parent
          bestParent.setValue(neighbour, edge.from);

          nextToVisit.add(neighbour);
        }
      }
    }
    return undefined;
}

function BFS<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    timeout : number
) : SearchResult<Node> {
    var steps = 0;
    var time = new Date().getTime();
    //Queue to handle exploring order of nodes
    var queue = new collections.Queue<Node>();
    //Store what is all nodes parent to handle the final path
    var parent = new collections.Dictionary<Node, Node>();
    parent.setValue(start, null);
    queue.add(start);
    //If more nodes are exploreable, explore
    while(!queue.isEmpty()){
        steps++;
        //Timeout if too long time has passed
        if(new Date().getTime() - time > timeout){
            throw ('Timeout');
        }
        var current : Node = queue.dequeue();
        console.log(parent);
        if(goal(current)){
            var pathNode = current;
            var path = new Array();
            //Calculate the path
            while(parent.getValue(pathNode) != null){
              path.push(pathNode);
              pathNode = parent.getValue(pathNode);
            }
            path.reverse();
            var result : SearchResult<Node> = {
                path: path,
                cost: path.length,
                steps: steps
            };
            console.log(result);
            return result;
        }
        var edges = graph.outgoingEdges(current);
        for(var edge of edges){
            if(!parent.containsKey(edge.to)){
                parent.setValue(edge.to, current);
                queue.add(edge.to);
            }
        }
    }

    return undefined;
}

function DFS<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    timeout : number
) : SearchResult<Node> {
    var steps = 0;
    var time = new Date().getTime();
    var stack = new collections.Stack<Node>();
    var parent = new collections.Dictionary<Node, Node>();
    parent.setValue(start, null);
    stack.add(start);

    while(!stack.isEmpty()){
        steps++;
        var current : Node = stack.pop();
        if(goal(current)){
            var pathNode = current;
            var path = new Array();
            //Calculate the path
            while(parent.getValue(pathNode) != null){
              path.push(pathNode);
              pathNode = parent.getValue(pathNode);
            }
            path.reverse();
            var result : SearchResult<Node> = {
                path: path,
                cost: path.length,
                steps: steps
            };
            return result;
        }
        var edges = graph.outgoingEdges(current);
        for(var edge of edges){
            if(!parent.containsKey(edge.to)){
                parent.setValue(edge.to, current);
                stack.push(edge.to);
            }

        }
    }

    return undefined;
}
