import { nodeEditorReducer, defaultNodeEditorData } from './reducer';
import { nodeEditorActions } from './actions';

describe('NodeEditor reducer - create node with fixed id and connect', () => {
  it('keeps the provided id via ADD_NODE_WITH_ID and allows connection to that id', () => {
    const srcNode = {
      id: 'src-1',
      type: 'standard',
      position: { x: 100, y: 100 },
      data: { title: 'Source' },
    };

    const dstNode = {
      id: 'dst-1',
      type: 'standard',
      position: { x: 300, y: 100 },
      data: { title: 'Target' },
    };

    const s1 = nodeEditorReducer(defaultNodeEditorData, nodeEditorActions.addNodeWithId(srcNode as any));
    const s2 = nodeEditorReducer(s1, nodeEditorActions.addNodeWithId(dstNode as any));

    // Sanity: both nodes must exist with the exact ids we provided
    expect(s2.nodes['src-1']).toBeDefined();
    expect(s2.nodes['dst-1']).toBeDefined();

    const s3 = nodeEditorReducer(
      s2,
      nodeEditorActions.addConnection({
        fromNodeId: 'src-1',
        fromPortId: 'output',
        toNodeId: 'dst-1',
        toPortId: 'input',
      })
    );

    const connections = Object.values(s3.connections);
    expect(connections.length).toBe(1);
    expect(connections[0].toNodeId).toBe('dst-1');
    // Ensure the destination node id remains resolvable for any downstream lookups
    expect(s3.nodes[connections[0].toNodeId]).toBeDefined();
  });
});

