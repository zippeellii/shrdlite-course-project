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
function aStarSearch<Node>(
  graph: Graph<Node>,
  start: Node,
  goal: (n: Node) => boolean,
  heuristics: (n: Node) => number,
  timeout: number
  ): SearchResult<Node> {
  let bestNode = start;
  let gCost = new collections.Dictionary<Node, number>();
  gCost.setValue(start, 0);
  let paths = new collections.Dictionary<Node, Node>();
  paths.setValue(start, null);

  let f = function(a: Node, b: Node): number {
    return gCost.getValue(b) + heuristics(b) - (gCost.getValue(a) + heuristics(a));
  };

  let frontier = new collections.PriorityQueue<Node>(f);
  // Add start node
  frontier.add(start);

  while (!goal(bestNode)) {

    bestNode = frontier.dequeue();
    for (let edge of graph.outgoingEdges(bestNode)) {
      let edgeCost = edge.cost;
      let gNew = gCost.getValue(edge.from) + edgeCost;
      if (gCost.containsKey(edge.to)) {
        let gOld = gCost.getValue(edge.to);
        if (gNew < gOld) {
          gCost.setValue(edge.to, gNew);
          paths.setValue(edge.to, edge.from);
          frontier.enqueue(edge.to);
        }
      } else {
        gCost.setValue(edge.to, gNew);
        paths.setValue(edge.to, edge.from);
        frontier.enqueue(edge.to);
      };
    };
  };
  let bestPath: Node[] = [];
  let cost = gCost.getValue(bestNode);
  while (bestNode != null) {
    bestPath.unshift(bestNode);
    bestNode = paths.getValue(bestNode);
  }
  let result = new SearchResult<Node>();
  result.path = bestPath;
  result.cost = cost;
  return result;


};
