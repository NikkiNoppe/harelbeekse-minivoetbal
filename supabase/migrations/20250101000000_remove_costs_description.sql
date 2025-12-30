-- Remove description column from costs table
-- Name is sufficient, description was redundant

-- Step 1: Check if description column exists and remove it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'costs' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.costs DROP COLUMN description;
        RAISE NOTICE 'Description column removed from costs table';
    ELSE
        RAISE NOTICE 'Description column does not exist in costs table (already removed)';
    END IF;
END $$;

-- Step 2: Verify the removal
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'costs'
ORDER BY ordinal_position;

