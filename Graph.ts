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
      var currentNode = nextToVisit.dequeue();
      console.log('Processing node: ' + currentNode);
      console.log(currentNode);
      if(goal(currentNode)){
        console.log('Found the goal');
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
            cost: gCost.getValue(currentNode)
        };
        console.log('Result from aStar in aStar: ' + result);
        return result;

      }
      processed.add(currentNode);
      console.log('Getting the edges');
      var edges = graph.outgoingEdges(currentNode);
      console.log('Got the edges');
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
