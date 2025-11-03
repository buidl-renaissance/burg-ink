-- Backfill sort_order for artwork based on created_at
-- This uses a CTE to assign row numbers to each artwork ordered by created_at
WITH numbered_artwork AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_sort_order
  FROM artwork
  WHERE deleted_at IS NULL
)
UPDATE artwork
SET sort_order = (
  SELECT new_sort_order 
  FROM numbered_artwork 
  WHERE numbered_artwork.id = artwork.id
)
WHERE id IN (SELECT id FROM numbered_artwork);

-- Backfill sort_order for tattoos based on created_at
WITH numbered_tattoos AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_sort_order
  FROM tattoos
  WHERE deleted_at IS NULL
)
UPDATE tattoos
SET sort_order = (
  SELECT new_sort_order 
  FROM numbered_tattoos 
  WHERE numbered_tattoos.id = tattoos.id
)
WHERE id IN (SELECT id FROM numbered_tattoos);

-- Display results
SELECT 'Artwork count:' as info, COUNT(*) as count FROM artwork WHERE deleted_at IS NULL
UNION ALL
SELECT 'Tattoos count:', COUNT(*) FROM tattoos WHERE deleted_at IS NULL;

