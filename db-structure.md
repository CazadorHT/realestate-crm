[
  {
    "label": "db_structure_json",
    "db_structure_json": {
      "enums": [
        {
          "name": "lead_activity_type",
          "schema": "public",
          "values": [
            "CALL",
            "LINE_CHAT",
            "EMAIL",
            "VIEWING",
            "FOLLOW_UP",
            "NOTE",
            "SYSTEM"
          ]
        },
        {
          "name": "user_role",
          "schema": "public",
          "values": [
            "ADMIN",
            "USER",
            "AGENT"
          ]
        },
        {
          "name": "property_status",
          "schema": "public",
          "values": [
            "DRAFT",
            "ACTIVE",
            "ARCHIVED",
            "UNDER_OFFER",
            "RESERVED",
            "SOLD",
            "RENTED"
          ]
        },
        {
          "name": "property_type",
          "schema": "public",
          "values": [
            "HOUSE",
            "CONDO",
            "TOWNHOME",
            "LAND",
            "OTHER",
            "OFFICE_BUILDING",
            "WAREHOUSE",
            "COMMERCIAL_BUILDING"
          ]
        },
        {
          "name": "listing_type",
          "schema": "public",
          "values": [
            "SALE",
            "RENT",
            "SALE_AND_RENT"
          ]
        },
        {
          "name": "lead_stage",
          "schema": "public",
          "values": [
            "NEW",
            "CONTACTED",
            "VIEWED",
            "NEGOTIATING",
            "CLOSED"
          ]
        },
        {
          "name": "lead_source",
          "schema": "public",
          "values": [
            "PORTAL",
            "FACEBOOK",
            "LINE",
            "WEBSITE",
            "REFERRAL",
            "OTHER"
          ]
        },
        {
          "name": "deal_type",
          "schema": "public",
          "values": [
            "RENT",
            "SALE"
          ]
        },
        {
          "name": "deal_status",
          "schema": "public",
          "values": [
            "NEGOTIATING",
            "SIGNED",
            "CANCELLED",
            "CLOSED_WIN",
            "CLOSED_LOSS"
          ]
        },
        {
          "name": "document_owner_type",
          "schema": "public",
          "values": [
            "LEAD",
            "PROPERTY",
            "DEAL",
            "RENTAL_CONTRACT"
          ]
        },
        {
          "name": "document_type",
          "schema": "public",
          "values": [
            "ID_CARD",
            "PASSPORT",
            "COMPANY_REGISTRATION",
            "LEASE_CONTRACT",
            "SALE_CONTRACT",
            "TITLE_DEED",
            "OTHER"
          ]
        },
        {
          "name": "lead_type",
          "schema": "public",
          "values": [
            "INDIVIDUAL",
            "COMPANY",
            "JURISTIC_PERSON"
          ]
        }
      ],
      "schema": "public",
      "tables": [
        {
          "table": "services",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "slug",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "title",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "description",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "content",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "cover_image",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "gallery_images",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 8,
              "name": "price_range",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 9,
              "name": "contact_link",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 10,
              "name": "is_active",
              "default": "true",
              "nullable": "NO",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 11,
              "name": "sort_order",
              "default": "0",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 12,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 13,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id)",
              "name": "services_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX services_slug_key ON public.services USING btree (slug)",
              "name": "services_slug_key"
            }
          ]
        },
        {
          "table": "property_matches",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "session_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "property_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "match_score",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 5,
              "name": "match_reasons",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 6,
              "name": "rank",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_matches_pkey ON public.property_matches USING btree (id)",
              "name": "property_matches_pkey"
            }
          ]
        },
        {
          "table": "blog_categories",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "slug",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "created_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX blog_categories_pkey ON public.blog_categories USING btree (id)",
              "name": "blog_categories_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX blog_categories_name_key ON public.blog_categories USING btree (name)",
              "name": "blog_categories_name_key"
            },
            {
              "def": "CREATE UNIQUE INDEX blog_categories_slug_key ON public.blog_categories USING btree (slug)",
              "name": "blog_categories_slug_key"
            }
          ]
        },
        {
          "table": "property_features",
          "columns": [
            {
              "pos": 1,
              "name": "property_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "feature_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_features_pkey ON public.property_features USING btree (property_id, feature_id)",
              "name": "property_features_pkey"
            }
          ]
        },
        {
          "table": "features",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "icon_key",
              "default": "'check'::text",
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "category",
              "default": "'General'::text",
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX features_pkey ON public.features USING btree (id)",
              "name": "features_pkey"
            }
          ]
        },
        {
          "table": "popular_areas",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "created_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX popular_areas_pkey ON public.popular_areas USING btree (id)",
              "name": "popular_areas_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX popular_areas_name_key ON public.popular_areas USING btree (name)",
              "name": "popular_areas_name_key"
            }
          ]
        },
        {
          "table": "site_settings",
          "columns": [
            {
              "pos": 1,
              "name": "key",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 2,
              "name": "value",
              "default": null,
              "nullable": "NO",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 3,
              "name": "updated_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX site_settings_pkey ON public.site_settings USING btree (key)",
              "name": "site_settings_pkey"
            }
          ]
        },
        {
          "table": "smart_match_budget_ranges",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "purpose",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "label",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "min_value",
              "default": null,
              "nullable": "NO",
              "udt_name": "int8",
              "data_type": "bigint"
            },
            {
              "pos": 5,
              "name": "max_value",
              "default": null,
              "nullable": "NO",
              "udt_name": "int8",
              "data_type": "bigint"
            },
            {
              "pos": 6,
              "name": "sort_order",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 7,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 8,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 9,
              "name": "updated_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX smart_match_budget_ranges_pkey ON public.smart_match_budget_ranges USING btree (id)",
              "name": "smart_match_budget_ranges_pkey"
            }
          ]
        },
        {
          "table": "profiles",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "role",
              "default": "'USER'::user_role",
              "nullable": "NO",
              "udt_name": "user_role",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 3,
              "name": "full_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "phone",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 6,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 7,
              "name": "email",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 8,
              "name": "avatar_url",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 9,
              "name": "line_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 10,
              "name": "facebook_url",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 11,
              "name": "other_contact",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 12,
              "name": "whatsapp_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 13,
              "name": "wechat_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 14,
              "name": "notification_preferences",
              "default": "'{\"activity\": true, \"new_lead\": true, \"assignment\": true, \"status_update\": false}'::jsonb",
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)",
              "name": "profiles_pkey"
            }
          ]
        },
        {
          "table": "property_search_sessions",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "session_token",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "purpose",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "budget_min",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 5,
              "name": "budget_max",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 6,
              "name": "preferred_area",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "ip_address",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 8,
              "name": "user_agent",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 9,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 10,
              "name": "lead_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 11,
              "name": "converted_at",
              "default": null,
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 12,
              "name": "near_transit",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 13,
              "name": "transit_station_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 14,
              "name": "transit_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 15,
              "name": "transit_distance_meters",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 16,
              "name": "preferred_property_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_search_sessions_pkey ON public.property_search_sessions USING btree (id)",
              "name": "property_search_sessions_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX property_search_sessions_session_token_key ON public.property_search_sessions USING btree (session_token)",
              "name": "property_search_sessions_session_token_key"
            }
          ]
        },
        {
          "table": "smart_match_property_types",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "label",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "value",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "sort_order",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 5,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 6,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX smart_match_property_types_pkey ON public.smart_match_property_types USING btree (id)",
              "name": "smart_match_property_types_pkey"
            }
          ]
        },
        {
          "table": "property_images",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "property_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "image_url",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "storage_path",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "is_cover",
              "default": "false",
              "nullable": "NO",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 6,
              "name": "sort_order",
              "default": "0",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_images_pkey ON public.property_images USING btree (id)",
              "name": "property_images_pkey"
            }
          ]
        },
        {
          "table": "smart_match_settings",
          "columns": [
            {
              "pos": 1,
              "name": "key",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 2,
              "name": "value",
              "default": "'{}'::jsonb",
              "nullable": "NO",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 3,
              "name": "updated_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX smart_match_settings_pkey ON public.smart_match_settings USING btree (key)",
              "name": "smart_match_settings_pkey"
            }
          ]
        },
        {
          "table": "leads",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "full_name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "phone",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "email",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "source",
              "default": "'OTHER'::lead_source",
              "nullable": "YES",
              "udt_name": "lead_source",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 6,
              "name": "stage",
              "default": "'NEW'::lead_stage",
              "nullable": "NO",
              "udt_name": "lead_stage",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 7,
              "name": "property_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 8,
              "name": "assigned_to",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 9,
              "name": "budget_min",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 10,
              "name": "budget_max",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 11,
              "name": "note",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 12,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 13,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 14,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 15,
              "name": "lead_type",
              "default": "'INDIVIDUAL'::lead_type",
              "nullable": "NO",
              "udt_name": "lead_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 16,
              "name": "nationality",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 17,
              "name": "is_foreigner",
              "default": "false",
              "nullable": "NO",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 18,
              "name": "preferred_property_types",
              "default": "'{}'::property_type[]",
              "nullable": "YES",
              "udt_name": "_property_type",
              "data_type": "ARRAY"
            },
            {
              "pos": 19,
              "name": "preferred_locations",
              "default": "'{}'::text[]",
              "nullable": "YES",
              "udt_name": "_text",
              "data_type": "ARRAY"
            },
            {
              "pos": 20,
              "name": "min_bedrooms",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 21,
              "name": "min_bathrooms",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 22,
              "name": "min_size_sqm",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 23,
              "name": "max_size_sqm",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 24,
              "name": "num_occupants",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 25,
              "name": "has_pets",
              "default": null,
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 26,
              "name": "need_company_registration",
              "default": null,
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 27,
              "name": "allow_airbnb",
              "default": null,
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 28,
              "name": "preferences",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 29,
              "name": "line_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id)",
              "name": "leads_pkey"
            },
            {
              "def": "CREATE INDEX idx_leads_stage ON public.leads USING btree (stage)",
              "name": "idx_leads_stage"
            },
            {
              "def": "CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to)",
              "name": "idx_leads_assigned_to"
            },
            {
              "def": "CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC)",
              "name": "idx_leads_created_at"
            },
            {
              "def": "CREATE INDEX idx_leads_property_id ON public.leads USING btree (property_id)",
              "name": "idx_leads_property_id"
            }
          ]
        },
        {
          "table": "documents",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "owner_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "document_owner_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 3,
              "name": "owner_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "document_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "document_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 5,
              "name": "storage_path",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "file_name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "mime_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 8,
              "name": "size_bytes",
              "default": null,
              "nullable": "YES",
              "udt_name": "int8",
              "data_type": "bigint"
            },
            {
              "pos": 9,
              "name": "is_encrypted",
              "default": "false",
              "nullable": "NO",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 10,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 11,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id)",
              "name": "documents_pkey"
            },
            {
              "def": "CREATE INDEX idx_documents_owner ON public.documents USING btree (owner_type, owner_id)",
              "name": "idx_documents_owner"
            },
            {
              "def": "CREATE INDEX idx_documents_type ON public.documents USING btree (document_type)",
              "name": "idx_documents_type"
            }
          ]
        },
        {
          "table": "rental_contracts",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "deal_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "rent_price",
              "default": null,
              "nullable": "NO",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 4,
              "name": "lease_term_months",
              "default": null,
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 5,
              "name": "start_date",
              "default": null,
              "nullable": "NO",
              "udt_name": "date",
              "data_type": "date"
            },
            {
              "pos": 6,
              "name": "end_date",
              "default": null,
              "nullable": "NO",
              "udt_name": "date",
              "data_type": "date"
            },
            {
              "pos": 7,
              "name": "check_in_date",
              "default": null,
              "nullable": "YES",
              "udt_name": "date",
              "data_type": "date"
            },
            {
              "pos": 8,
              "name": "check_out_date",
              "default": null,
              "nullable": "YES",
              "udt_name": "date",
              "data_type": "date"
            },
            {
              "pos": 9,
              "name": "deposit_amount",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 10,
              "name": "payment_cycle",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 11,
              "name": "notice_period_days",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 12,
              "name": "other_terms",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 13,
              "name": "contract_number",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 14,
              "name": "status",
              "default": "'DRAFT'::text",
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 15,
              "name": "advance_payment_amount",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 16,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 17,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 18,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 19,
              "name": "updated_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX rental_contracts_pkey ON public.rental_contracts USING btree (id)",
              "name": "rental_contracts_pkey"
            },
            {
              "def": "CREATE INDEX idx_rental_contracts_deal_id ON public.rental_contracts USING btree (deal_id)",
              "name": "idx_rental_contracts_deal_id"
            },
            {
              "def": "CREATE INDEX idx_rental_contracts_status ON public.rental_contracts USING btree (status)",
              "name": "idx_rental_contracts_status"
            }
          ]
        },
        {
          "table": "property_image_uploads",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "user_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "session_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "property_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 5,
              "name": "storage_path",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "status",
              "default": "'TEMP'::text",
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_image_uploads_pkey ON public.property_image_uploads USING btree (id)",
              "name": "property_image_uploads_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX property_image_uploads_storage_path_key ON public.property_image_uploads USING btree (storage_path)",
              "name": "property_image_uploads_storage_path_key"
            },
            {
              "def": "CREATE INDEX idx_piu_user_id ON public.property_image_uploads USING btree (user_id)",
              "name": "idx_piu_user_id"
            },
            {
              "def": "CREATE INDEX idx_piu_session_id ON public.property_image_uploads USING btree (session_id)",
              "name": "idx_piu_session_id"
            },
            {
              "def": "CREATE INDEX idx_piu_status_created_at ON public.property_image_uploads USING btree (status, created_at)",
              "name": "idx_piu_status_created_at"
            },
            {
              "def": "CREATE INDEX idx_piu_property_id ON public.property_image_uploads USING btree (property_id)",
              "name": "idx_piu_property_id"
            }
          ]
        },
        {
          "table": "smart_match_office_sizes",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "label",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "min_sqm",
              "default": "0",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 4,
              "name": "max_sqm",
              "default": "9999",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 5,
              "name": "sort_order",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 6,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX smart_match_office_sizes_pkey ON public.smart_match_office_sizes USING btree (id)",
              "name": "smart_match_office_sizes_pkey"
            }
          ]
        },
        {
          "table": "faqs",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "question",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "answer",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "category",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "sort_order",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 6,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 8,
              "name": "updated_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX faqs_pkey ON public.faqs USING btree (id)",
              "name": "faqs_pkey"
            }
          ]
        },
        {
          "table": "lead_activities",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "lead_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "property_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "activity_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "lead_activity_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 5,
              "name": "note",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX lead_activities_pkey ON public.lead_activities USING btree (id)",
              "name": "lead_activities_pkey"
            },
            {
              "def": "CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id)",
              "name": "idx_lead_activities_lead_id"
            },
            {
              "def": "CREATE INDEX idx_lead_activities_property_id ON public.lead_activities USING btree (property_id)",
              "name": "idx_lead_activities_property_id"
            }
          ]
        },
        {
          "table": "owners",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "full_name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "phone",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "line_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "facebook_url",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "other_contact",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 8,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 9,
              "name": "owner_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 10,
              "name": "company_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 11,
              "name": "created_by",
              "default": "auth.uid()",
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX owners_pkey ON public.owners USING btree (id)",
              "name": "owners_pkey"
            }
          ]
        },
        {
          "table": "partners",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "name",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "logo_url",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "website_url",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "sort_order",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 6,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 7,
              "name": "created_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 8,
              "name": "updated_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX partners_pkey ON public.partners USING btree (id)",
              "name": "partners_pkey"
            }
          ]
        },
        {
          "table": "deals",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "lead_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "property_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "deal_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "deal_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 5,
              "name": "status",
              "default": "'NEGOTIATING'::deal_status",
              "nullable": "NO",
              "udt_name": "deal_status",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 6,
              "name": "source",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "co_agent_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 8,
              "name": "co_agent_contact",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 9,
              "name": "commission_percent",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 10,
              "name": "commission_amount",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 11,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 12,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 13,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 14,
              "name": "closed_at",
              "default": null,
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 15,
              "name": "transaction_date",
              "default": null,
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 16,
              "name": "transaction_end_date",
              "default": null,
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 17,
              "name": "co_agent_online",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id)",
              "name": "deals_pkey"
            },
            {
              "def": "CREATE INDEX idx_deals_lead_id ON public.deals USING btree (lead_id)",
              "name": "idx_deals_lead_id"
            },
            {
              "def": "CREATE INDEX idx_deals_property_id ON public.deals USING btree (property_id)",
              "name": "idx_deals_property_id"
            },
            {
              "def": "CREATE INDEX idx_deals_status ON public.deals USING btree (status)",
              "name": "idx_deals_status"
            }
          ]
        },
        {
          "table": "audit_logs",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 3,
              "name": "user_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 4,
              "name": "action",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "entity",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "entity_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 7,
              "name": "metadata",
              "default": "'{}'::jsonb",
              "nullable": "NO",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)",
              "name": "audit_logs_pkey"
            },
            {
              "def": "CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id)",
              "name": "audit_logs_user_id_idx"
            },
            {
              "def": "CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity)",
              "name": "audit_logs_entity_idx"
            },
            {
              "def": "CREATE INDEX audit_logs_entity_id_idx ON public.audit_logs USING btree (entity_id)",
              "name": "audit_logs_entity_id_idx"
            },
            {
              "def": "CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at)",
              "name": "audit_logs_created_at_idx"
            }
          ]
        },
        {
          "table": "blog_posts",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "slug",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "title",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "excerpt",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "content",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "cover_image",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "category",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 8,
              "name": "author",
              "default": "'{\"name\": \"SABAICAZA\"}'::jsonb",
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 9,
              "name": "published_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 10,
              "name": "reading_time",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 11,
              "name": "tags",
              "default": "'{}'::text[]",
              "nullable": "YES",
              "udt_name": "_text",
              "data_type": "ARRAY"
            },
            {
              "pos": 12,
              "name": "is_published",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 13,
              "name": "created_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 14,
              "name": "updated_at",
              "default": "now()",
              "nullable": "YES",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 15,
              "name": "structured_data",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id)",
              "name": "blog_posts_pkey"
            },
            {
              "def": "CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug)",
              "name": "blog_posts_slug_key"
            },
            {
              "def": "CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug)",
              "name": "idx_blog_posts_slug"
            },
            {
              "def": "CREATE INDEX idx_blog_posts_category ON public.blog_posts USING btree (category)",
              "name": "idx_blog_posts_category"
            },
            {
              "def": "CREATE INDEX idx_blog_posts_published_at ON public.blog_posts USING btree (published_at)",
              "name": "idx_blog_posts_published_at"
            }
          ]
        },
        {
          "table": "property_agents",
          "columns": [
            {
              "pos": 1,
              "name": "property_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "agent_id",
              "default": null,
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 3,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX property_agents_pkey ON public.property_agents USING btree (property_id, agent_id)",
              "name": "property_agents_pkey"
            }
          ]
        },
        {
          "table": "properties",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "title",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "description",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "property_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "property_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 5,
              "name": "listing_type",
              "default": null,
              "nullable": "NO",
              "udt_name": "listing_type",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 6,
              "name": "status",
              "default": "'DRAFT'::property_status",
              "nullable": "NO",
              "udt_name": "property_status",
              "data_type": "USER-DEFINED"
            },
            {
              "pos": 7,
              "name": "price",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 8,
              "name": "rental_price",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 9,
              "name": "currency",
              "default": "'THB'::text",
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 10,
              "name": "bedrooms",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 11,
              "name": "bathrooms",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 12,
              "name": "size_sqm",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 13,
              "name": "land_size_sqwah",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 14,
              "name": "address_line1",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 15,
              "name": "province",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 16,
              "name": "district",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 17,
              "name": "subdistrict",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 18,
              "name": "postal_code",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 21,
              "name": "created_by",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 22,
              "name": "assigned_to",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 23,
              "name": "created_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 24,
              "name": "updated_at",
              "default": "now()",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 25,
              "name": "images",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 26,
              "name": "slug",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 27,
              "name": "meta_title",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 28,
              "name": "meta_description",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 29,
              "name": "meta_keywords",
              "default": null,
              "nullable": "YES",
              "udt_name": "_text",
              "data_type": "ARRAY"
            },
            {
              "pos": 30,
              "name": "structured_data",
              "default": null,
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 31,
              "name": "owner_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 32,
              "name": "property_source",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 33,
              "name": "floor",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 34,
              "name": "parking_slots",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 35,
              "name": "maintenance_fee",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 36,
              "name": "zoning",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 37,
              "name": "google_maps_link",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 38,
              "name": "commission_sale_percentage",
              "default": "3.0",
              "nullable": "YES",
              "udt_name": "float8",
              "data_type": "double precision"
            },
            {
              "pos": 39,
              "name": "commission_rent_months",
              "default": "0.5",
              "nullable": "YES",
              "udt_name": "float8",
              "data_type": "double precision"
            },
            {
              "pos": 40,
              "name": "popular_area",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 41,
              "name": "near_transit",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 42,
              "name": "transit_station_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 43,
              "name": "transit_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 44,
              "name": "transit_distance_meters",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 46,
              "name": "co_agent_contact_channel",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 47,
              "name": "is_co_agent",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 48,
              "name": "co_agent_name",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 49,
              "name": "co_agent_phone",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 50,
              "name": "co_agent_contact_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 51,
              "name": "co_agent_sale_commission_percent",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 52,
              "name": "co_agent_rent_commission_months",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 53,
              "name": "original_price",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 54,
              "name": "original_rental_price",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 55,
              "name": "verified",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 56,
              "name": "min_contract_months",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 57,
              "name": "view_count",
              "default": "0",
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 58,
              "name": "nearby_places",
              "default": "'[]'::jsonb",
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 59,
              "name": "nearby_transits",
              "default": "'[]'::jsonb",
              "nullable": "YES",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            },
            {
              "pos": 60,
              "name": "electricity_charge",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 61,
              "name": "water_charge",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 62,
              "name": "parking_fee_additional",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 63,
              "name": "rent_free_period_days",
              "default": null,
              "nullable": "YES",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 64,
              "name": "parking_type",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 65,
              "name": "ceiling_height",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 66,
              "name": "orientation",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 67,
              "name": "price_per_sqm",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 68,
              "name": "rent_price_per_sqm",
              "default": null,
              "nullable": "YES",
              "udt_name": "numeric",
              "data_type": "numeric"
            },
            {
              "pos": 69,
              "name": "is_bare_shell",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 70,
              "name": "is_exclusive",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 71,
              "name": "has_raised_floor",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 72,
              "name": "is_pet_friendly",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 73,
              "name": "is_foreigner_quota",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 74,
              "name": "allow_smoking",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 75,
              "name": "is_renovated",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 76,
              "name": "is_fully_furnished",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 77,
              "name": "is_corner_unit",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 78,
              "name": "has_private_pool",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 79,
              "name": "is_selling_with_tenant",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 80,
              "name": "has_garden_view",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 81,
              "name": "has_pool_view",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 82,
              "name": "has_city_view",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 83,
              "name": "facing_east",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 84,
              "name": "facing_north",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 85,
              "name": "has_multi_parking",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 86,
              "name": "is_grade_a",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 87,
              "name": "is_grade_b",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 88,
              "name": "is_grade_c",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 89,
              "name": "is_column_free",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 90,
              "name": "is_central_air",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 91,
              "name": "is_split_air",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 92,
              "name": "has_247_access",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 93,
              "name": "has_fiber_optic",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 94,
              "name": "is_tax_registered",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 95,
              "name": "has_unblocked_view",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 96,
              "name": "has_river_view",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 97,
              "name": "is_high_ceiling",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 98,
              "name": "facing_south",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 99,
              "name": "facing_west",
              "default": "false",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 100,
              "name": "total_units",
              "default": "1",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            },
            {
              "pos": 101,
              "name": "sold_units",
              "default": "0",
              "nullable": "NO",
              "udt_name": "int4",
              "data_type": "integer"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX properties_slug_key ON public.properties USING btree (slug)",
              "name": "properties_slug_key"
            },
            {
              "def": "CREATE UNIQUE INDEX properties_pkey ON public.properties USING btree (id)",
              "name": "properties_pkey"
            },
            {
              "def": "CREATE INDEX idx_properties_status ON public.properties USING btree (status)",
              "name": "idx_properties_status"
            },
            {
              "def": "CREATE INDEX idx_properties_created_at ON public.properties USING btree (created_at DESC)",
              "name": "idx_properties_created_at"
            },
            {
              "def": "CREATE INDEX idx_properties_assigned_to ON public.properties USING btree (assigned_to)",
              "name": "idx_properties_assigned_to"
            },
            {
              "def": "CREATE INDEX idx_properties_created_by ON public.properties USING btree (created_by)",
              "name": "idx_properties_created_by"
            },
            {
              "def": "CREATE INDEX idx_properties_hot_deals ON public.properties USING btree (original_price) WHERE (original_price IS NOT NULL)",
              "name": "idx_properties_hot_deals"
            }
          ]
        },
        {
          "table": "line_templates",
          "columns": [
            {
              "pos": 1,
              "name": "key",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 2,
              "name": "label",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 3,
              "name": "is_active",
              "default": "true",
              "nullable": "YES",
              "udt_name": "bool",
              "data_type": "boolean"
            },
            {
              "pos": 4,
              "name": "config",
              "default": "'{}'::jsonb",
              "nullable": "NO",
              "udt_name": "jsonb",
              "data_type": "jsonb"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX line_templates_pkey ON public.line_templates USING btree (key)",
              "name": "line_templates_pkey"
            }
          ]
        },
        {
          "table": "ai_usage_logs",
          "columns": [
            {
              "pos": 1,
              "name": "id",
              "default": "gen_random_uuid()",
              "nullable": "NO",
              "udt_name": "uuid",
              "data_type": "uuid"
            },
            {
              "pos": 2,
              "name": "created_at",
              "default": "timezone('utc'::text, now())",
              "nullable": "NO",
              "udt_name": "timestamptz",
              "data_type": "timestamp with time zone"
            },
            {
              "pos": 3,
              "name": "model",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 4,
              "name": "feature",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 5,
              "name": "status",
              "default": null,
              "nullable": "NO",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 6,
              "name": "error_message",
              "default": null,
              "nullable": "YES",
              "udt_name": "text",
              "data_type": "text"
            },
            {
              "pos": 7,
              "name": "user_id",
              "default": null,
              "nullable": "YES",
              "udt_name": "uuid",
              "data_type": "uuid"
            }
          ],
          "indexes": [
            {
              "def": "CREATE UNIQUE INDEX ai_usage_logs_pkey ON public.ai_usage_logs USING btree (id)",
              "name": "ai_usage_logs_pkey"
            },
            {
              "def": "CREATE INDEX ai_usage_logs_created_at_idx ON public.ai_usage_logs USING btree (created_at)",
              "name": "ai_usage_logs_created_at_idx"
            }
          ]
        }
      ]
    }
  }
]