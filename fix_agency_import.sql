-- Fix agency data import
-- This script inserts or updates the agencies provided in the CSV data.
-- It handles potential issues with whitespace and encoding from the CSV import.

INSERT INTO public.agencies (
    id,
    agency_name,
    comments,
    created_at,
    updated_at,
    balance,
    user_id,
    currency,
    city
) VALUES
    (
        '6e85bb5d-10e0-46e5-a7e1-4741e79f771c',
        'TÜMER',
        NULL,
        '2025-12-30 09:54:39.682963+00',
        '2025-12-30 09:54:39.682963+00',
        0,
        NULL,
        'EUR',
        NULL
    ),
    (
        '4884f17e-d5ad-446c-8feb-cea3894d0fe4',
        'STEFANO EASY TRANSFER',
        NULL,
        '2025-12-17 19:04:57.990044+00',
        '2026-01-07 08:10:54.56957+00',
        -110,
        NULL,
        'EUR',
        NULL
    ),
    (
        '1db06d07-458e-4584-af30-4a63523bb517',
        'Orjin Agenvy',
        NULL,
        '2026-01-08 22:41:29.568454+00',
        '2026-01-10 00:59:39.564913+00',
        -596.47,
        '1eb228f2-45b3-4ef8-a513-8aec76b3fd91',
        'EUR',
        NULL
    ),
    (
        '1ea14d07-f734-4fcd-b651-df2304de3d03',
        'MEET TRANSFER ONLİNE',
        NULL,
        '2025-12-10 14:19:22.778562+00',
        '2026-01-11 19:30:37.086614+00',
        -90,
        NULL,
        'EUR',
        NULL
    ),
    (
        'bc1cce46-4c00-43b6-8517-72c786799ab2',
        'A-N Transfer',
        NULL,
        '2026-02-03 14:32:07.215093+00',
        '2026-02-03 14:32:07.215093+00',
        0,
        '6e28b7cd-6351-4886-a71a-3f97cb7f09d0',
        'GBP',
        NULL
    ),
    (
        'd8ca5e62-d888-43e5-8ff8-684745254370',
        'EXCLUSIVE CARS&DRIVERS S.L',
        'we would like to be your partner, offering VIP personal transport, in Valencia, Spain, and all around Spain',
        '2026-02-05 17:07:24.856661+00',
        '2026-02-05 17:07:24.856661+00',
        0,
        'f07dcfa0-89b4-4d5c-ab92-54d13d2f1f5d',
        'EUR',
        NULL
    ),
    (
        'ddc3103b-1003-4d68-a393-b02a798ee3ce',
        'VİATOR',
        NULL,
        '2025-12-10 14:18:55.816305+00',
        '2026-02-08 00:37:21.866684+00',
        -9159.21,
        NULL,
        'EUR',
        NULL
    ),
    (
        'a87cdea4-27fe-4332-bbaf-00b9001ed469',
        'RENK TRAVEL',
        NULL,
        '2025-12-10 14:18:10.259793+00',
        '2026-02-08 00:37:59.509178+00',
        -21850,
        NULL,
        'EUR',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    agency_name = EXCLUDED.agency_name,
    comments = EXCLUDED.comments,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    balance = EXCLUDED.balance,
    user_id = EXCLUDED.user_id,
    currency = EXCLUDED.currency,
    city = EXCLUDED.city;
