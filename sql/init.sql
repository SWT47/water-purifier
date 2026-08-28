-- ============================================================
-- 净水器直播展示系统 - 数据库初始化脚本
-- PostgreSQL 14+ / Vercel Postgres
-- ============================================================

-- 产品表
CREATE TABLE IF NOT EXISTS product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(50) NOT NULL,
  brand varchar(255),
  name varchar(255),
  model varchar(255),
  white_bg_image text,
  launch_year varchar(20),
  is_on_sale boolean DEFAULT true,
  daily_price numeric,
  reference_price numeric,
  flux varchar(100),
  water_flow_rate varchar(100),
  faucet varchar(100),
  dimensions varchar(255),
  water_mode varchar(255),
  ro_membrane_brand varchar(100),
  filter_total_cost numeric,
  activated_carbon varchar(255),
  has_maternity_cert boolean DEFAULT false,
  has_zero_stagnant_water boolean DEFAULT false,
  real_images text[] DEFAULT '{}',
  real_videos text[] DEFAULT '{}',
  heating_element varchar(100),
  heating_capacity varchar(100),
  temp_control varchar(255),
  has_water_tank boolean DEFAULT false,
  is_automatic boolean DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_category ON product (category);
CREATE INDEX IF NOT EXISTS idx_product_brand ON product (brand);
CREATE INDEX IF NOT EXISTS idx_product_is_on_sale ON product (is_on_sale);

-- 搭配方案表
CREATE TABLE IF NOT EXISTS combo_scheme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  product_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  live_price numeric,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_combo_scheme_created_at ON combo_scheme (created_at DESC);

-- ============================================================
-- 示例数据（可选，执行后可看到演示效果）
-- ============================================================

-- 示例产品（净水器 3 个 + 管线机 2 个 + 前置过滤器 2 个 + 大白瓶 1 个 + 中央净水机 1 个 = 9 个）
INSERT INTO product (category, brand, name, model, white_bg_image, launch_year, is_on_sale, daily_price, reference_price, flux, water_flow_rate, faucet, dimensions, water_mode, ro_membrane_brand, filter_total_cost, activated_carbon, has_maternity_cert, has_zero_stagnant_water, real_images, real_videos) VALUES
('water_purifier', '美的', '白泽净水器', 'MRO1782D-600G', 'https://picsum.photos/seed/midea-white/600/600', '2024', true, 1299, 2999, '600G', '1.58L/min', '双出水龙头', '430x150x400mm', '直饮/生活双出水', '陶氏', 599, '椰壳活性炭', true, true, '{"https://picsum.photos/seed/midea-real1/800/600","https://picsum.photos/seed/midea-real2/800/600"}', '{"https://www.w3schools.com/html/mov_bbb.mp4"}'),
('water_purifier', '小米', '米家净水器 1000G', 'MR872-A', 'https://picsum.photos/seed/xiaomi-white/600/600', '2023', true, 899, 1999, '1000G', '2.4L/min', '单出水龙头', '420x140x400mm', '直饮', '海德能', 399, '颗粒活性炭', false, true, '{"https://picsum.photos/seed/xiaomi-real1/800/600","https://picsum.photos/seed/xiaomi-real2/800/600"}', '{"https://www.w3schools.com/html/movie.mp4"}'),
('water_purifier', '沁园', '小白鲸净水器', 'KRL5018', 'https://picsum.photos/seed/qinyuan-white/600/600', '2024', true, 1499, 3299, '800G', '2L/min', '双出水智能龙头', '450x160x420mm', '直饮/生活双出水', '东丽', 699, '烧结活性炭', true, false, '{"https://picsum.photos/seed/qinyuan-real1/800/600","https://picsum.photos/seed/qinyuan-real2/800/600"}', '{}'),
('pipeline_machine', '美的', '即热管线机', 'MG908-R', 'https://picsum.photos/seed/midea-pipeline/600/600', '2024', true, 599, 1299, NULL, NULL, NULL, '230x95x390mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/pipeline-real1/800/600"}', '{}'),
('pipeline_machine', '小米', '即热饮水机', 'MJMY23YM', 'https://picsum.photos/seed/xiaomi-dispenser/600/600', '2023', true, 399, 899, NULL, NULL, NULL, '210x85x350mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/dispenser-real1/800/600"}', '{}'),
('pre_filter', '美的', '前置过滤器', 'QZBW20S-22', 'https://picsum.photos/seed/midea-prefilter/600/600', '2024', true, 399, 799, '5T/h', NULL, NULL, '180x80x250mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/prefilter-real1/800/600"}', '{}'),
('pre_filter', '沁园', '前置过滤器', 'FMP292', 'https://picsum.photos/seed/qinyuan-prefilter/600/600', '2023', true, 499, 899, '6T/h', NULL, NULL, '200x90x260mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/qyprefilter-real1/800/600"}', '{}'),
('big_white_bottle', '滨特尔', '大白瓶前置过滤器', 'BF-10-B', 'https://picsum.photos/seed/pentair-whitebottle/600/600', '2024', true, 699, 1299, NULL, NULL, NULL, '300x120x450mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/whitebottle-real1/800/600"}', '{}'),
('central_purifier', '滨特尔', '中央净水机', 'CF-1054', 'https://picsum.photos/seed/pentair-central/600/600', '2024', true, 3999, 6999, '2T/h', NULL, NULL, '350x350x1200mm', NULL, NULL, NULL, NULL, false, false, '{"https://picsum.photos/seed/central-real1/800/600"}', '{}')
ON CONFLICT DO NOTHING;

-- 示例搭配方案（2 个）
INSERT INTO combo_scheme (name, product_ids, live_price)
SELECT '全屋净水三件套',
  ARRAY[
    (SELECT id FROM product WHERE model = 'KRL5018' LIMIT 1),
    (SELECT id FROM product WHERE model = 'FMP292' LIMIT 1),
    (SELECT id FROM product WHERE model = 'MG908-R' LIMIT 1)
  ]::uuid[],
  2599
WHERE EXISTS (SELECT 1 FROM product WHERE model = 'KRL5018')
  AND EXISTS (SELECT 1 FROM product WHERE model = 'FMP292')
  AND EXISTS (SELECT 1 FROM product WHERE model = 'MG908-R')
ON CONFLICT DO NOTHING;

INSERT INTO combo_scheme (name, product_ids, live_price)
SELECT '性价比两件套',
  ARRAY[
    (SELECT id FROM product WHERE model = 'MR872-A' LIMIT 1),
    (SELECT id FROM product WHERE model = 'MJMY23YM' LIMIT 1)
  ]::uuid[],
  1199
WHERE EXISTS (SELECT 1 FROM product WHERE model = 'MR872-A')
  AND EXISTS (SELECT 1 FROM product WHERE model = 'MJMY23YM')
ON CONFLICT DO NOTHING;
