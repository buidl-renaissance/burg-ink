-- Add sort_order column to artwork table
ALTER TABLE artwork ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order column to tattoos table
ALTER TABLE tattoos ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index on artwork.sort_order
CREATE INDEX artwork_sort_order_idx ON artwork(sort_order);

-- Create index on tattoos.sort_order
CREATE INDEX tattoos_sort_order_idx ON tattoos(sort_order);

