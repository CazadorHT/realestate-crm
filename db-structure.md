db_structure_json                                                                    {
    "enums": [
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
            "name": "deal_type",
            "schema": "public",
            "values": [
                "RENT",
                "SALE"
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
            "name": "lead_type",
            "schema": "public",
            "values": [
                "INDIVIDUAL",
                "COMPANY",
                "JURISTIC_PERSON"
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
            "name": "user_role",
            "schema": "public",
            "values": [
                "ADMIN",
                "USER",
                "AGENT"
            ]
        }
    ],
    "schema": "public",
    "tables": [
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
        }
    ],
    "foreign_keys": [
        {
            "to_table": "profiles",
            "constraint": "deals_created_by_fkey",
            "from_table": "deals",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "created_by"
            ]
        },
        {
            "to_table": "leads",
            "constraint": "deals_lead_id_fkey",
            "from_table": "deals",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "lead_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "deals_property_id_fkey",
            "from_table": "deals",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "profiles",
            "constraint": "documents_created_by_fkey",
            "from_table": "documents",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "created_by"
            ]
        },
        {
            "to_table": "profiles",
            "constraint": "lead_activities_created_by_fkey",
            "from_table": "lead_activities",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "created_by"
            ]
        },
        {
            "to_table": "leads",
            "constraint": "lead_activities_lead_id_fkey",
            "from_table": "lead_activities",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "lead_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "lead_activities_property_id_fkey",
            "from_table": "lead_activities",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "leads_property_id_fkey",
            "from_table": "leads",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "profiles",
            "constraint": "properties_assigned_to_profile_fkey",
            "from_table": "properties",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "assigned_to"
            ]
        },
        {
            "to_table": "owners",
            "constraint": "properties_owner_id_fkey",
            "from_table": "properties",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "owner_id"
            ]
        },
        {
            "to_table": "profiles",
            "constraint": "property_agents_agent_id_fkey",
            "from_table": "property_agents",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "agent_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "property_agents_property_id_fkey",
            "from_table": "property_agents",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "property_image_uploads_property_id_fkey",
            "from_table": "property_image_uploads",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "property_images_property_id_fkey",
            "from_table": "property_images",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "properties",
            "constraint": "property_matches_property_id_fkey",
            "from_table": "property_matches",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "property_id"
            ]
        },
        {
            "to_table": "property_search_sessions",
            "constraint": "property_matches_session_id_fkey",
            "from_table": "property_matches",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "session_id"
            ]
        },
        {
            "to_table": "leads",
            "constraint": "property_search_sessions_lead_id_fkey",
            "from_table": "property_search_sessions",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "lead_id"
            ]
        },
        {
            "to_table": "deals",
            "constraint": "rental_contracts_deal_id_fkey",
            "from_table": "rental_contracts",
            "to_columns": [
                "id"
            ],
            "from_columns": [
                "deal_id"
            ]
        }
    ],
    "generated_at": "2026-01-05T08:27:19.120667+00:00"
} |