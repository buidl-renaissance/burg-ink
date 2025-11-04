import { NextApiRequest, NextApiResponse } from 'next';
import {
  getLinkedWorks,
  createWorkRelationship,
  deleteWorkRelationshipByEntities,
} from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // Get all linked works for a given entity
        const { entityType, entityId } = req.query;

        if (!entityType || !entityId) {
          return res.status(400).json({
            error: 'Missing required parameters: entityType and entityId',
          });
        }

        if (entityType !== 'artwork' && entityType !== 'tattoo') {
          return res.status(400).json({
            error: 'Invalid entityType. Must be "artwork" or "tattoo"',
          });
        }

        const linkedWorks = await getLinkedWorks(
          entityType as 'artwork' | 'tattoo',
          parseInt(entityId as string)
        );

        res.status(200).json({ data: linkedWorks });
        break;

      case 'POST':
        // Create a new work relationship
        const {
          sourceType,
          sourceId,
          targetType,
          targetId,
          relationshipType,
        } = req.body;

        if (!sourceType || !sourceId || !targetType || !targetId) {
          return res.status(400).json({
            error:
              'Missing required fields: sourceType, sourceId, targetType, targetId',
          });
        }

        if (
          (sourceType !== 'artwork' && sourceType !== 'tattoo') ||
          (targetType !== 'artwork' && targetType !== 'tattoo')
        ) {
          return res.status(400).json({
            error: 'Invalid entity type. Must be "artwork" or "tattoo"',
          });
        }

        // Prevent linking to self
        if (sourceType === targetType && sourceId === targetId) {
          return res.status(400).json({
            error: 'Cannot link an entity to itself',
          });
        }

        const newRelationship = await createWorkRelationship(
          sourceType,
          sourceId,
          targetType,
          targetId,
          relationshipType || 'related'
        );

        res.status(201).json({ data: newRelationship });
        break;

      case 'DELETE':
        // Delete a work relationship
        const {
          sourceType: delSourceType,
          sourceId: delSourceId,
          targetType: delTargetType,
          targetId: delTargetId,
        } = req.body;

        if (!delSourceType || !delSourceId || !delTargetType || !delTargetId) {
          return res.status(400).json({
            error:
              'Missing required fields: sourceType, sourceId, targetType, targetId',
          });
        }

        await deleteWorkRelationshipByEntities(
          delSourceType,
          delSourceId,
          delTargetType,
          delTargetId
        );

        res.status(200).json({ success: true });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Work relationships API error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

