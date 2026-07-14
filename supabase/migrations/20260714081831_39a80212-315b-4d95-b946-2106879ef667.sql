
CREATE TABLE public.pricing_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('labor','material','disposal','prep')),
  item_key TEXT NOT NULL,
  description TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trade, item_key)
);

GRANT SELECT ON public.pricing_benchmarks TO authenticated;
GRANT SELECT ON public.pricing_benchmarks TO anon;
GRANT ALL ON public.pricing_benchmarks TO service_role;

ALTER TABLE public.pricing_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benchmarks are readable by everyone"
  ON public.pricing_benchmarks FOR SELECT
  USING (true);

CREATE TRIGGER update_pricing_benchmarks_updated_at
  BEFORE UPDATE ON public.pricing_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pricing_benchmarks_trade ON public.pricing_benchmarks(trade);

-- Seed data (national averages, 2025)
INSERT INTO public.pricing_benchmarks (trade, item_type, item_key, description, base_price, unit) VALUES
  -- Painting
  ('painting','labor','painter_hourly','Professional painter labor (prep, prime, and 2 coats)',60,'hour'),
  ('painting','labor','painter_helper_hourly','Painter helper / apprentice labor',40,'hour'),
  ('painting','material','interior_paint_gallon','Premium interior latex paint (satin/eggshell finish)',48,'gallon'),
  ('painting','material','exterior_paint_gallon','Premium exterior acrylic paint (weather-resistant)',58,'gallon'),
  ('painting','material','primer_gallon','Stain-blocking latex primer',32,'gallon'),
  ('painting','material','painters_tape','Blue painter''s tape 1.88in x 60yd',8,'roll'),
  ('painting','material','drop_cloth','9x12 canvas drop cloth',18,'each'),
  ('painting','material','roller_kit','Roller frame, cover, and tray kit',22,'each'),
  ('painting','prep','wall_prep_sqft','Wall prep: patch nail holes, sand, caulk trim',0.75,'sq_ft'),

  -- Drywall
  ('drywall','labor','drywall_installer_hourly','Drywall installer labor (hang, tape, mud, sand)',65,'hour'),
  ('drywall','material','drywall_sheet_4x8','1/2" drywall sheet 4ft x 8ft',16,'sheet'),
  ('drywall','material','drywall_sheet_4x12','1/2" drywall sheet 4ft x 12ft',22,'sheet'),
  ('drywall','material','joint_compound','5-gallon bucket all-purpose joint compound',18,'each'),
  ('drywall','material','drywall_tape','Paper drywall tape 500ft roll',6,'roll'),
  ('drywall','material','drywall_screws','1-5/8" coarse drywall screws (1 lb box)',9,'box'),

  -- Plumbing
  ('plumbing','labor','plumber_hourly','Licensed plumber labor',110,'hour'),
  ('plumbing','labor','plumber_apprentice_hourly','Plumber apprentice labor',65,'hour'),
  ('plumbing','material','standard_toilet','Standard 2-piece elongated toilet with wax ring and bolts',185,'each'),
  ('plumbing','material','kitchen_faucet','Mid-grade single-handle kitchen faucet',165,'each'),
  ('plumbing','material','bathroom_faucet','Mid-grade widespread bathroom faucet',135,'each'),
  ('plumbing','material','shutoff_valve','1/4-turn angle stop shutoff valve',12,'each'),
  ('plumbing','material','pex_pipe','1/2" PEX-A tubing (per foot)',1.2,'foot'),
  ('plumbing','material','pvc_drain_pipe','1-1/2" PVC drain pipe (per foot)',1.8,'foot'),
  ('plumbing','material','wax_ring','Toilet wax ring with horn',6,'each'),
  ('plumbing','material','supply_line','Braided stainless steel supply line 20"',9,'each'),
  ('plumbing','disposal','fixture_haul_away','Old fixture haul-away and disposal',45,'each'),

  -- Electrical
  ('electrical','labor','electrician_hourly','Licensed electrician labor',115,'hour'),
  ('electrical','labor','electrician_apprentice_hourly','Electrician apprentice labor',70,'hour'),
  ('electrical','material','gfci_outlet','15A tamper-resistant GFCI outlet',22,'each'),
  ('electrical','material','standard_outlet','15A tamper-resistant duplex outlet',5,'each'),
  ('electrical','material','light_switch','Single-pole decorator light switch',6,'each'),
  ('electrical','material','dimmer_switch','LED-compatible dimmer switch',28,'each'),
  ('electrical','material','ceiling_fixture','Standard ceiling light fixture (semi-flush LED)',75,'each'),
  ('electrical','material','recessed_light','4" LED recessed retrofit downlight',28,'each'),
  ('electrical','material','ceiling_fan','Mid-grade 52" ceiling fan with light kit',180,'each'),
  ('electrical','material','romex_12_2','12-2 NM-B Romex wire (per foot)',1.1,'foot'),
  ('electrical','material','breaker_20a','20A single-pole breaker (matched to panel)',15,'each'),
  ('electrical','material','junction_box','Old-work single-gang plastic junction box',3,'each'),

  -- Roofing
  ('roofing','labor','roofer_hourly','Roofing labor (crew rate per worker-hour)',80,'hour'),
  ('roofing','material','asphalt_shingles','Architectural asphalt shingles (30-yr) per bundle',42,'bundle'),
  ('roofing','material','roofing_underlayment','Synthetic roofing underlayment per sq ft',0.35,'sq_ft'),
  ('roofing','material','roofing_nails','Galvanized roofing nails (5 lb box)',22,'box'),
  ('roofing','material','drip_edge','Aluminum drip edge (10ft length)',12,'each'),
  ('roofing','material','ridge_cap','Ridge cap shingles per bundle',48,'bundle'),
  ('roofing','material','ice_water_shield','Ice & water shield membrane (per sq ft)',0.85,'sq_ft'),
  ('roofing','disposal','roof_tearoff','Tear-off and disposal per square (100 sq ft)',110,'square'),

  -- Flooring
  ('flooring','labor','flooring_installer_hourly','Flooring installer labor',70,'hour'),
  ('flooring','material','lvp_flooring','Luxury vinyl plank flooring per sq ft',3.5,'sq_ft'),
  ('flooring','material','laminate_flooring','Laminate flooring per sq ft',2.8,'sq_ft'),
  ('flooring','material','engineered_hardwood','Engineered hardwood flooring per sq ft',6.5,'sq_ft'),
  ('flooring','material','tile_flooring','Porcelain tile per sq ft',5.5,'sq_ft'),
  ('flooring','material','carpet_flooring','Mid-grade carpet with pad per sq ft',3.75,'sq_ft'),
  ('flooring','material','tile_thinset','Modified thinset mortar 50lb bag',28,'bag'),
  ('flooring','material','grout','Sanded grout 25lb bag',22,'bag'),
  ('flooring','material','underlayment_pad','Foam flooring underlayment per sq ft',0.4,'sq_ft'),
  ('flooring','prep','floor_prep_sqft','Floor prep: level, clean, install underlayment',1.25,'sq_ft'),
  ('flooring','disposal','old_flooring_removal','Remove and haul away old flooring per sq ft',1.5,'sq_ft'),

  -- HVAC
  ('hvac','labor','hvac_technician_hourly','Licensed HVAC technician labor',125,'hour'),
  ('hvac','material','refrigerant_r410a','R-410A refrigerant per lb',85,'lb'),
  ('hvac','material','thermostat_smart','Wi-Fi programmable smart thermostat',185,'each'),
  ('hvac','material','duct_flex_8in','8" insulated flex duct (per foot)',4.5,'foot'),
  ('hvac','material','air_filter','Pleated MERV 11 air filter',18,'each'),

  -- General / carpentry
  ('general','labor','handyman_hourly','General handyman labor',65,'hour'),
  ('general','labor','carpenter_hourly','Finish carpenter labor',75,'hour'),
  ('general','labor','helper_hourly','General laborer / helper',40,'hour'),
  ('general','material','interior_door_slab','Hollow-core interior door slab 30x80',95,'each'),
  ('general','material','interior_door_prehung','Pre-hung interior door with jamb 30x80',185,'each'),
  ('general','material','entry_door','Steel insulated exterior entry door 36x80',350,'each'),
  ('general','material','deadbolt','Grade 2 deadbolt lockset',48,'each'),
  ('general','material','doorknob_lockset','Grade 2 keyed entry doorknob',38,'each'),
  ('general','material','baseboard_trim','5-1/4" primed MDF baseboard (per linear ft)',2.2,'foot'),
  ('general','material','crown_molding','Primed MDF crown molding (per linear ft)',3.5,'foot'),
  ('general','material','caulk_tube','Paintable acrylic caulk',7,'tube'),
  ('general','material','construction_screws','1-lb box construction screws',12,'box'),
  ('general','material','plywood_sheet','3/4" CDX plywood sheet 4x8',52,'sheet'),
  ('general','material','2x4_stud','2x4x8 SPF stud',5,'each'),
  ('general','disposal','dumpster_rental','10-yard dumpster rental (1 week)',425,'each'),
  ('general','disposal','debris_haul_away','Debris haul-away pickup truck load',175,'load'),

  -- Pressure washing / exterior
  ('exterior','labor','pressure_washing_hourly','Pressure washing labor',75,'hour'),
  ('exterior','material','pressure_wash_detergent','House wash detergent concentrate (gallon)',28,'gallon'),
  ('exterior','labor','gutter_cleaning_hourly','Gutter cleaning labor',65,'hour'),
  ('exterior','material','gutter_5in','5" aluminum K-style gutter (per linear ft)',8.5,'foot');
