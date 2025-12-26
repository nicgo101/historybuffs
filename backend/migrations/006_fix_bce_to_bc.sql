-- Migration: Update BCE/CE notation to BC/AD in factoid summaries
-- This changes the display convention to the more traditional BC/AD format

-- Update summaries that contain BCE to BC
UPDATE factoids
SET summary = REPLACE(summary, ' BCE', ' BC')
WHERE summary LIKE '% BCE%';

-- Update summaries that contain CE to AD
UPDATE factoids
SET summary = REPLACE(summary, ' CE', ' AD')
WHERE summary LIKE '% CE%'
  AND summary NOT LIKE '% BCE%';  -- Avoid matching already-processed BCE
