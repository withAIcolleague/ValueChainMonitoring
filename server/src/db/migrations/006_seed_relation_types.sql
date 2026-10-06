INSERT OR IGNORE INTO relation_types (code, label_ko, color, directionality) VALUES
  ('RAW_MATERIAL_SUPPLY', '원재료 공급', '#2563eb', 'directed'),
  ('COMPONENT_SUPPLY', '부품 공급', '#0891b2', 'directed'),
  ('CUSTOMER', '고객사', '#ea580c', 'directed'),
  ('DISTRIBUTOR', '유통/판매', '#65a30d', 'directed'),
  ('COMPETITOR', '경쟁사', '#dc2626', 'undirected'),
  ('PARTNER', '파트너/제휴', '#7c3aed', 'undirected');
