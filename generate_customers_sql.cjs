const fs = require('fs');

// Raw data from user (split to avoid shell limit)
const part1 = `[{""created_at"":""2025-12-25T21:20:05.346605+00:00"",""customer_name"":""Lauren Barnes"",""customer_phone"":""+447496362467"",""customer_user_id"":null,""id"":""b66702f9-40e1-45ae-9b38-db95e25ff14f"",""last_message_at"":""2025-12-25T21:20:05.346605+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-25T21:20:05.346605+00:00""},{""created_at"":""2026-01-08T22:06:24.259625+00:00"",""customer_name"":""Mohmed"",""customer_phone"":""+97451846754"",""customer_user_id"":null,""id"":""61d73218-3777-4504-8813-03c70c3b831d"",""last_message_at"":""2026-01-08T22:11:06.526+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-08T22:06:24.259625+00:00""},{""created_at"":""2026-01-29T08:54:08.932195+00:00"",""customer_name"":""Lev"",""customer_phone"":""+79039734448"",""customer_user_id"":null,""id"":""bdb1464f-2b89-42ab-bc16-4233dfd4d908"",""last_message_at"":""2026-01-29T08:55:11.319+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-29T08:54:08.932195+00:00""},{""created_at"":""2026-01-31T15:54:00.618376+00:00"",""customer_name"":""Belmin"",""customer_phone"":""+4915156869682"",""customer_user_id"":null,""id"":""567c4a96-27f3-4346-8889-ea83ed0fb488"",""last_message_at"":""2026-01-31T15:55:31.147+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-31T15:54:00.618376+00:00""},{""created_at"":""2026-02-13T17:25:15.526114+00:00"",""customer_name"":""Thane Kramer"",""customer_phone"":""+17205032722"",""customer_user_id"":null,""id"":""17d71dd9-3f9a-4fd5-a692-105fba464f22"",""last_message_at"":""2026-02-13T17:27:51.919+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-13T17:25:15.526114+00:00""},{""created_at"":""2026-01-11T00:58:33.094546+00:00"",""customer_name"":""muhmmadqayyumazam"",""customer_phone"":""+966547815592"",""customer_user_id"":null,""id"":""f802329d-1792-4696-be34-4fadf4ecd9f2"",""last_message_at"":""2026-01-11T01:01:24.174+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-11T00:58:33.094546+00:00""},{""created_at"":""2026-01-14T10:27:19.02054+00:00"",""customer_name"":""mdomar445566"",""customer_phone"":""+966535168679"",""customer_user_id"":null,""id"":""bcce9fb7-50dd-4d47-b426-8798af8ff239"",""last_message_at"":""2026-01-14T10:34:52.122+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-14T10:27:19.02054+00:00""},{""created_at"":""2026-01-13T17:34:47.535569+00:00"",""customer_name"":""Hayri"",""customer_phone"":""+4917621830230"",""customer_user_id"":null,""id"":""a17b59b6-6288-4715-90c1-3bf87bb436de"",""last_message_at"":""2026-01-13T17:35:03.821+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-13T17:34:47.535569+00:00""},{""created_at"":""2026-02-01T04:44:50.324296+00:00"",""customer_name"":""Eve Camenzind"",""customer_phone"":""+16044148116"",""customer_user_id"":null,""id"":""8e79ac32-20b9-42e9-83b0-43ff41c560fa"",""last_message_at"":""2026-02-01T04:44:50.324296+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-01T04:44:50.324296+00:00""},{""created_at"":""2025-12-25T15:06:52.414287+00:00"",""customer_name"":""Mesut"",""customer_phone"":""+905526794134"",""customer_user_id"":null,""id"":""8a7a9546-1104-46b9-9d34-f24ae2d13252"",""last_message_at"":""2025-12-29T14:23:54.556+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-25T15:06:52.414287+00:00""},{""created_at"":""2025-12-29T11:33:52.419902+00:00"",""customer_name"":""Walid Boudana"",""customer_phone"":""+213784202464"",""customer_user_id"":null,""id"":""0f4f74ce-7d0a-471f-b0f6-5d4c00481cd6"",""last_message_at"":""2025-12-29T21:46:24.49+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-29T11:33:52.419902+00:00""},{""created_at"":""2026-02-03T11:01:35.728348+00:00"",""customer_name"":""😬"",""customer_phone"":""+6594238283"",""customer_user_id"":null,""id"":""d965a9b8-e41c-48f4-add8-901945ad0c80"",""last_message_at"":""2026-02-03T11:25:29.423+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-03T11:01:35.728348+00:00""},{""created_at"":""2026-01-11T21:48:20.073609+00:00"",""customer_name"":""David Reid"",""customer_phone"":""+447868616711"",""customer_user_id"":null,""id"":""7c352289-9a36-427c-824a-f78c5bd5fc20"",""last_message_at"":""2026-01-11T21:50:15.335+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-11T21:48:20.073609+00:00""},{""created_at"":""2026-02-07T21:47:33.12825+00:00"",""customer_name"":""."",""customer_phone"":""+905309225893"",""customer_user_id"":null,""id"":""9466976e-3022-4f5b-bb8f-42e2a3b02b90"",""last_message_at"":""2026-02-07T21:47:33.12825+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-07T21:47:33.12825+00:00""},{""created_at"":""2025-12-23T21:34:54.451028+00:00"",""customer_name"":""Meet Transfer"",""customer_phone"":""+905530344150"",""customer_user_id"":null,""id"":""61a0c769-0f7d-4431-94d8-3561a7cc1e3d"",""last_message_at"":""2026-01-07T15:25:54.745+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-23T21:34:54.451028+00:00""},{""created_at"":""2026-01-07T21:04:19.150163+00:00"",""customer_name"":""Khuram"",""customer_phone"":""+971509552969"",""customer_user_id"":null,""id"":""42a06d56-e5b5-46b5-a8cd-772cf8835eb9"",""last_message_at"":""2026-01-07T21:04:19.150163+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-07T21:04:19.150163+00:00""},{""created_at"":""2026-02-11T10:06:56.224391+00:00"",""customer_name"":""S"",""customer_phone"":""+447398423572"",""customer_user_id"":null,""id"":""020d9d6f-b8d4-46d3-b186-91a90ed493de"",""last_message_at"":""2026-02-11T10:11:46.604+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-11T10:06:56.224391+00:00""},{""created_at"":""2026-01-02T12:09:51.242484+00:00"",""customer_name"":""Sidi Ykhlef Salim"",""customer_phone"":""+213555619032"",""customer_user_id"":null,""id"":""e734d199-f89e-491f-b549-caf9e4ffd812"",""last_message_at"":""2026-01-02T12:09:51.242484+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-02T12:09:51.242484+00:00""},{""created_at"":""2025-12-26T19:15:31.126365+00:00"",""customer_name"":""Yeshiwork Tarekegn"",""customer_phone"":""+971552810283"",""customer_user_id"":null,""id"":""21d44d8b-944a-4017-bc55-b6495c146ee9"",""last_message_at"":""2025-12-26T19:17:13.595+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-26T19:15:31.126365+00:00""},{""created_at"":""2026-02-10T19:41:17.141946+00:00"",""customer_name"":""Junior"",""customer_phone"":""+447581129920"",""customer_user_id"":null,""id"":""c19b1275-a1ef-4abb-8673-b516464dba8c"",""last_message_at"":""2026-02-10T22:43:57.003+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-10T19:41:17.141946+00:00""}]`;
const part2 = `[{""created_at"":""2026-02-10T18:04:45.882019+00:00"",""customer_name"":""Stefano"",""customer_phone"":""+393475945774"",""customer_user_id"":null,""id"":""0fa87c9c-f23a-42ee-972c-7045460fa82e"",""last_message_at"":""2026-02-10T18:08:00.51+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-10T18:04:45.882019+00:00""},{""created_at"":""2025-12-25T18:17:29.980839+00:00"",""customer_name"":""Aslıhan Kahraman"",""customer_phone"":""+905448833404"",""customer_user_id"":null,""id"":""004a7752-9f67-4e10-8012-10babbbee577"",""last_message_at"":""2025-12-26T19:24:56.81+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-25T18:17:29.980839+00:00""},{""created_at"":""2026-01-04T20:08:59.46822+00:00"",""customer_name"":""🌑"",""customer_phone"":""+447375787390"",""customer_user_id"":null,""id"":""9899dcca-62c8-4394-9ef0-d6ebf89ef884"",""last_message_at"":""2026-01-04T20:11:54.157+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-04T20:08:59.46822+00:00""},{""created_at"":""2026-01-07T21:09:58.122972+00:00"",""customer_name"":""serajalamansari1"",""customer_phone"":""+966554084578"",""customer_user_id"":null,""id"":""58a5c5b8-a3cf-4692-b860-66f0f751740e"",""last_message_at"":""2026-01-07T21:20:52.08+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-07T21:09:58.122972+00:00""},{""created_at"":""2026-01-15T18:34:15.12153+00:00"",""customer_name"":""denis tarrin"",""customer_phone"":""+18085611199"",""customer_user_id"":null,""id"":""44c94295-585c-47c8-8cbb-063546ba8e10"",""last_message_at"":""2026-01-15T19:42:13.4+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-15T18:34:15.12153+00:00""},{""created_at"":""2026-01-23T12:19:53.720577+00:00"",""customer_name"":""Regiane"",""customer_phone"":""+5511975701101"",""customer_user_id"":null,""id"":""c655d6c9-5abd-4ed6-825c-a42eb30fe636"",""last_message_at"":""2026-01-23T14:38:58.522+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-23T12:19:53.720577+00:00""},{""created_at"":""2026-01-14T13:57:00.616362+00:00"",""customer_name"":""mk"",""customer_phone"":""+919544309510"",""customer_user_id"":null,""id"":""6cecb0fd-7bb0-4afd-ad25-783c4e64dc8d"",""last_message_at"":""2026-01-14T14:01:55.747+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-14T13:57:00.616362+00:00""},{""created_at"":""2026-01-15T16:30:04.658786+00:00"",""customer_name"":""sshaam423"",""customer_phone"":""+923349442091"",""customer_user_id"":null,""id"":""13289780-c043-447b-ba9e-eee075ac455d"",""last_message_at"":""2026-01-15T16:30:04.658786+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-15T16:30:04.658786+00:00""},{""created_at"":""2026-01-13T16:32:27.234711+00:00"",""customer_name"":""Aytac Ozgenc"",""customer_phone"":""+905340415677"",""customer_user_id"":null,""id"":""3734db5a-b67a-4a4c-ba37-a11fe9cb1331"",""last_message_at"":""2026-01-13T16:32:27.234711+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-13T16:32:27.234711+00:00""},{""created_at"":""2026-01-13T14:04:17.035307+00:00"",""customer_name"":""La Vida"",""customer_phone"":""+32498457569"",""customer_user_id"":null,""id"":""ca8a2654-c57a-462c-8360-f8cfe371bbcb"",""last_message_at"":""2026-01-13T14:13:52.802+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-13T14:04:17.035307+00:00""},{""created_at"":""2026-01-12T09:24:15.457313+00:00"",""customer_name"":""Fier Et Fort"",""customer_phone"":""+25377083931"",""customer_user_id"":null,""id"":""ae78e58f-70fb-4497-9a7e-53af75d01d0f"",""last_message_at"":""2026-01-12T09:43:30.632+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-12T09:24:15.457313+00:00""},{""created_at"":""2026-02-11T16:14:10.345635+00:00"",""customer_name"":""."",""customer_phone"":""+491731820779"",""customer_user_id"":null,""id"":""3774011c-c089-4528-a282-c3ccf7169a3c"",""last_message_at"":""2026-02-11T16:16:02.481+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-11T16:14:10.345635+00:00""},{""created_at"":""2026-02-10T22:09:32.926669+00:00"",""customer_name"":""Pantie Eleftheriou"",""customer_phone"":""+35799557390"",""customer_user_id"":null,""id"":""24e4c48c-4a4f-4a63-b4af-d2a4c5eda2a3"",""last_message_at"":""2026-02-10T22:18:40.976+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-10T22:09:32.926669+00:00""},{""created_at"":""2026-01-16T22:08:45.071569+00:00"",""customer_name"":""Wajdi"",""customer_phone"":""+33659535930"",""customer_user_id"":null,""id"":""92c9153e-6b30-46d0-a40e-5a115700e89c"",""last_message_at"":""2026-01-16T22:13:38.204+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-16T22:08:45.071569+00:00""},{""created_at"":""2026-01-17T01:09:58.465101+00:00"",""customer_name"":""(°`✓ Bahar Ali✓`°)"",""customer_phone"":""+923159103313"",""customer_user_id"":null,""id"":""57ca08fc-56ea-4acf-9ffe-83101fb64818"",""last_message_at"":""2026-01-17T01:09:58.465101+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-17T01:09:58.465101+00:00""},{""created_at"":""2026-01-17T06:22:05.945912+00:00"",""customer_name"":""mohammdanowar643@gmil.com"",""customer_phone"":""+966532523551"",""customer_user_id"":null,""id"":""96215d53-1e17-4089-91fc-3bbc98587e30"",""last_message_at"":""2026-01-17T06:22:05.945912+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-17T06:22:05.945912+00:00""},{""created_at"":""2026-01-23T19:05:20.270981+00:00"",""customer_name"":""Kamil"",""customer_phone"":""+4915151445295"",""customer_user_id"":null,""id"":""5509e260-8bff-4eaa-a06f-05d0bdefe1dc"",""last_message_at"":""2026-01-23T19:05:20.270981+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-23T19:05:20.270981+00:00""},{""created_at"":""2026-01-18T10:15:31.169227+00:00"",""customer_name"":""cilesganon"",""customer_phone"":""+966578599396"",""customer_user_id"":null,""id"":""1becdc8a-87f6-4ece-805a-9b419911ad9f"",""last_message_at"":""2026-01-18T10:15:31.169227+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-18T10:15:31.169227+00:00""},{""created_at"":""2026-01-19T16:33:36.441846+00:00"",""customer_name"":""RJO Blanco"",""customer_phone"":""+447508572889"",""customer_user_id"":null,""id"":""146ec881-2fe1-4264-a8cc-e8d5edf91782"",""last_message_at"":""2026-01-19T16:33:36.441846+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-19T16:33:36.441846+00:00""},{""created_at"":""2026-02-12T13:59:29.954612+00:00"",""customer_name"":""Dušan Vuković"",""customer_phone"":""+381607004072"",""customer_user_id"":null,""id"":""c6c0984e-d093-46b1-9a20-fec47fe8841c"",""last_message_at"":""2026-02-12T14:13:21.21+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-12T13:59:29.954612+00:00""},{""created_at"":""2026-01-24T22:49:54.778073+00:00"",""customer_name"":""Eralp Berk"",""customer_phone"":""+905402208990"",""customer_user_id"":null,""id"":""86b4cc59-a164-444e-abce-76bd10023b18"",""last_message_at"":""2026-01-24T22:49:54.778073+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-24T22:49:54.778073+00:00""},{""created_at"":""2025-12-26T19:15:56.788541+00:00"",""customer_name"":""Meet Transfer"",""customer_phone"":""+905321748390"",""customer_user_id"":null,""id"":""3918dec9-bdf2-4c5b-a980-4d37299d1a4f"",""last_message_at"":""2026-01-25T09:13:30.269+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2025-12-26T19:15:56.788541+00:00""},{""created_at"":""2026-01-28T12:22:04.578045+00:00"",""customer_name"":""Jordan Ostle"",""customer_phone"":""+447495147558"",""customer_user_id"":null,""id"":""c16d9eea-1dd8-48d1-8412-f786bcd278f5"",""last_message_at"":""2026-01-28T12:23:40.872+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-01-28T12:22:04.578045+00:00""},{""created_at"":""2026-02-13T10:05:40.980023+00:00"",""customer_name"":""Ed Danaci"",""customer_phone"":""+905437183140"",""customer_user_id"":null,""id"":""5423db07-10f1-4bed-8bfb-dbdc33d0e44f"",""last_message_at"":""2026-02-13T10:20:42.619+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-13T10:05:40.980023+00:00""},{""created_at"":""2026-02-13T11:18:31.723602+00:00"",""customer_name"":""Tee"",""customer_phone"":""+2349027332157"",""customer_user_id"":null,""id"":""a6a32466-d4f6-4d78-bde2-98aba8b8439f"",""last_message_at"":""2026-02-13T11:28:06.35+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-13T11:18:31.723602+00:00""},{""created_at"":""2026-02-14T23:17:36.859174+00:00"",""customer_name"":""Jomin"",""customer_phone"":""+447816920189"",""customer_user_id"":null,""id"":""7e1eda85-b9e8-4e64-849e-6b5b40fd97bc"",""last_message_at"":""2026-02-14T23:22:40.12+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-14T23:17:36.859174+00:00""},{""created_at"":""2026-02-14T09:28:34.83298+00:00"",""customer_name"":""Tim"",""customer_phone"":""+447900188589"",""customer_user_id"":null,""id"":""ba3e8c8d-b0d8-4dfa-8545-0c7ef450f324"",""last_message_at"":""2026-02-15T20:15:56.817+00:00"",""status"":""active"",""unread_count"":0,""updated_at"":""2026-02-14T09:28:34.83298+00:00""},{""created_at"":""2026-02-18T15:27:13.987842+00:00"",""customer_name"":""Garrett  Kramer"",""customer_phone"":""+12156053059"",""customer_user_id"":null,""id"":""cbe21cda-f8ae-438d-b661-dfe2e3f9ee56"",""last_message_at"":""2026-02-18T15:27:34.463+00:00"",""status"":""active"",""unread_count"":2,""updated_at"":""2026-02-18T15:27:13.987842+00:00""}]`;

// Wrap in array if not already
let cleanedData = part1 + part2;
// Check if part1 ends with } and part2 starts with ,
if (part1.trim().endsWith('}') && part2.trim().startsWith(',')) {
    // Correctly joined
} else if (part1.trim().endsWith('}') && part2.trim().startsWith('{')) {
    // Missing comma
    cleanedData = part1 + "," + part2;
}

// Remove array brackets if present to re-wrap correctly
cleanedData = cleanedData.trim();
if (cleanedData.startsWith('[')) cleanedData = cleanedData.substring(1);
if (cleanedData.endsWith(']')) cleanedData = cleanedData.substring(0, cleanedData.length - 1);

cleanedData = '[' + cleanedData + ']';

cleanedData = cleanedData.replace(/""/g, '"');

let customers;
try {
    customers = JSON.parse(cleanedData);
} catch (e) {
    console.error("JSON Parse Error:", e.message);
    // Fallback: Try to parse part1 and part2 separately if combined fails
    try {
        const c1 = JSON.parse('[' + part1.replace(/^\[/, '').replace(/\]$/, '').replace(/""/g, '"') + ']');
        const c2 = JSON.parse('[' + part2.replace(/^\[/, '').replace(/\]$/, '').replace(/""/g, '"') + ']');
        customers = [...c1, ...c2];
    } catch (e2) {
        process.exit(1);
    }
}


const sqlValues = customers.map(c => {
    const formatValue = (val) => val === null ? 'NULL' : (typeof val === 'string' ? `'${val}'` : val);
    
    return `(
    ${formatValue(c.id)}, 
    ${formatValue(c.customer_name)}, 
    ${formatValue(c.customer_phone)}, 
    ${formatValue(c.customer_user_id)}, 
    ${formatValue(c.last_message_at)}, 
    ${formatValue(c.status)}, 
    ${formatValue(c.unread_count)}, 
    ${formatValue(c.created_at)}, 
    ${formatValue(c.updated_at)}
    )`;
}).join(',\n');

const sql = `
-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    customer_phone TEXT,
    customer_user_id UUID,
    last_message_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy for customers (Optional, but good practice)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Only create policy if it doesn't exist to avoid errors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Admins can manage customers' 
        AND polrelid = 'public.customers'::regclass
    ) THEN
        CREATE POLICY "Admins can manage customers"
        ON public.customers
        FOR ALL
        USING (public.has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;


-- Insert Customer Data
INSERT INTO public.customers (
    id, customer_name, customer_phone, customer_user_id, last_message_at, 
    status, unread_count, created_at, updated_at
) VALUES
${sqlValues}
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  customer_user_id = EXCLUDED.customer_user_id,
  last_message_at = EXCLUDED.last_message_at,
  status = EXCLUDED.status,
  unread_count = EXCLUDED.unread_count,
  created_at = EXCLUDED.created_at,
  updated_at = now();
`;

fs.writeFileSync('insert_customers.sql', sql);
console.log('insert_customers.sql oluşturuldu.');
