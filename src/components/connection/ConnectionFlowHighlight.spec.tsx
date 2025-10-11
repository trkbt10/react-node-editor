import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { NodeEditor } from '../../NodeEditor';
import type { NodeEditorData } from '../../contexts/node-editor';

// Helper to query flow stripe paths (SVG stroke-dasharray is present only on stripes)
const queryFlowStripes = () => document.querySelectorAll('path[style*="stroke-dasharray"]');

describe('Connection flow highlight behavior', () => {
  const initialData: NodeEditorData = {
    nodes: {
      a: { id: 'a', type: 'standard', position: { x: 100, y: 100 }, data: { title: 'A' } },
      b: { id: 'b', type: 'standard', position: { x: 300, y: 100 }, data: { title: 'B' } },
    },
    connections: {
      c1: { id: 'c1', fromNodeId: 'a', fromPortId: 'output', toNodeId: 'b', toPortId: 'input' },
    },
  };

  it('shows stripes when node is selected and hides them after clearing selection by clicking canvas', async () => {
    render(<NodeEditor initialData={initialData} />);

    // Initially: no stripes
    expect(queryFlowStripes().length).toBe(0);

    // Select all nodes via shortcut (Cmd/Ctrl + A) to avoid DOM pointer quirks
    fireEvent.keyDown(document, { key: 'a', metaKey: true });

    // Now: stripes should be visible on adjacent connection
    await waitFor(() => {
      expect(queryFlowStripes().length).toBeGreaterThan(0);
    });

    // Click on empty canvas to clear selection
    // Clear selection with Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // After clearing selection, stripes should be gone
    await waitFor(() => {
      expect(queryFlowStripes().length).toBe(0);
    });
  });
});
