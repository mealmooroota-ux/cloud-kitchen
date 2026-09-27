-- MOOROOTA trial content (v2). Safe to run more than once.
-- Adds dishes + trial photos, the new homepage/kitchen-page text, a week of meal-plan menus, and the brand name.
-- NOTE: this REPLACES the homepage text sections with the new copy. Edit them afterwards in Admin > Site content.
-- Photos are free Unsplash stock images for trial use: replace with photos of your own food before launch.

-- MOOROOTA order numbers (MR-20001, ...)
alter table public.orders alter column order_number set default ('MR-' || nextval('public.order_number_seq'));

update public.settings set kitchen_name = 'MOOROOTA' where kitchen_name in ('Cloud Kitchen', '');

insert into public.categories (name, slug, position) values
 ('Breakfast','breakfast',0),('Homestyle meals','homestyle',2),('Snacks','snacks',6)
on conflict (slug) do update set name = excluded.name, position = excluded.position;

insert into public.products (category_id, name, slug, description, price_paise, is_veg, prep_minutes, serves, calories, protein_g, tags, show_on_home, in_plan_rotation, position)
select c.id, v.name, v.slug, v.description, v.price, v.veg, v.prep, v.serves, v.kcal, v.protein, v.tags, v.home, v.plan, v.pos
from (values
 ('breakfast','Masala dosa','masala-dosa','Crisp, golden dosa folded over spiced potato palya, with sambar and two chutneys.',11900,true,15,'1',420,9,'{"Homestyle"}'::text[],true,true,10),
 ('breakfast','Plain dosa & coconut chutney','plain-dosa','Thin, crisp dosa from batter fermented overnight, with fresh coconut chutney and sambar.',8900,true,12,'1',320,7,'{"Homestyle"}'::text[],false,true,11),
 ('breakfast','Idli sambar (3)','idli-sambar','Three soft steamed idlis with drumstick sambar and coconut chutney.',7900,true,10,'1',310,10,'{"Healthy","Low oil"}'::text[],false,true,12),
 ('breakfast','Ragi dosa','ragi-dosa','Finger-millet dosa with a lacy crunch, served with peanut chutney.',9900,true,12,'1',280,8,'{"Healthy","Millet"}'::text[],false,true,13),
 ('breakfast','Kanda poha','kanda-poha','Flattened rice with onion, peanuts, curry leaves and a squeeze of lemon.',6900,true,10,'1',290,6,'{"Light"}'::text[],false,true,14),
 ('breakfast','Rava upma','rava-upma','Roasted semolina with vegetables, ginger and cashew, tempered in ghee.',6900,true,10,'1',300,7,'{}'::text[],false,true,15),
 ('homestyle','South Indian meals','south-indian-meals','Rice, sambar, rasam, two palyas, kootu, curd, papad and payasam, served the traditional way.',22900,true,18,'1',720,18,'{"Homestyle"}'::text[],true,true,16),
 ('homestyle','Mini thali','mini-thali','Dal, sabzi, rice, two phulkas and curd. A smaller everyday plate.',18900,true,15,'1',560,17,'{"Homestyle"}'::text[],false,true,17),
 ('homestyle','Dal palak with phulkas','dal-palak-phulka','Moong dal simmered with spinach and garlic, with three hand-rolled phulkas.',17900,true,15,'1',480,20,'{"Healthy","High protein"}'::text[],false,true,18),
 ('homestyle','Veg pulao & raita','veg-pulao-raita','Basmati cooked with seasonal vegetables and whole spices, with cucumber raita.',17900,true,15,'1',520,11,'{}'::text[],false,true,19),
 ('homestyle','Bisi bele bath','bisi-bele-bath','Karnataka’s classic: rice, toor dal and vegetables with our own roasted masala.',14900,true,15,'1',510,14,'{"Homestyle"}'::text[],false,true,20),
 ('homestyle','Curd rice','curd-rice','Soft rice folded into home-set curd, tempered with mustard, ginger and curry leaves.',9900,true,8,'1',380,10,'{"Light"}'::text[],false,true,21),
 ('curries','Kadai paneer','kadai-paneer','Paneer and peppers tossed in a fresh-ground kadai masala.',29900,true,18,'1–2',460,19,'{}'::text[],false,false,22),
 ('curries','Home-style chicken curry','home-chicken-curry','Bone-in chicken in an onion-tomato gravy, cooked the way it’s made at home on Sundays.',27900,false,25,'1–2',520,34,'{"Homestyle","High protein"}'::text[],true,false,23),
 ('curries','Egg curry','egg-curry','Two boiled eggs in a coconut and pepper gravy.',21900,false,15,'1',390,18,'{"High protein"}'::text[],false,false,24),
 ('healthy','Little millet pongal','millet-pongal','Little millet and moong dal cooked soft with pepper, cumin and a spoon of ghee.',17900,true,15,'1',410,15,'{"Healthy","Millet"}'::text[],false,true,25),
 ('healthy','Kosambari & sprout bowl','sprout-bowl','Moong sprouts, cucumber, carrot, pomegranate and coconut, with a lemon dressing.',16900,true,8,'1',260,14,'{"Healthy","High fibre","Low oil"}'::text[],false,true,26),
 ('biryani','Veg dum biryani','veg-dum-biryani','Vegetables and basmati layered with mint and saffron, slow-steamed in a sealed pot.',27900,true,30,'2',690,15,'{}'::text[],false,false,27),
 ('snacks','Samosa (2)','samosa','Flaky pastry filled with spiced potato and peas, with mint and tamarind chutneys.',5900,true,8,'1',310,6,'{}'::text[],false,false,28),
 ('desserts','Rice kheer','rice-kheer','Rice slow-cooked in milk with cardamom, saffron and nuts.',9900,true,2,'1',280,7,'{}'::text[],false,false,29),
 ('desserts','Gajar halwa','gajar-halwa','Carrots cooked down in milk and ghee until rich and fudgy.',11900,true,2,'1',330,6,'{}'::text[],false,false,30)
) as v(cat, name, slug, description, price, veg, prep, serves, kcal, protein, tags, home, plan, pos)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- trial photos (only for dishes that have no photo yet)
insert into public.product_media (product_id, public_id, kind, alt, position)
select p.id, v.url, 'image', v.alt, 0 from (values
 ('masala-dosa','https://images.unsplash.com/photo-1668236543090-82eba5ee5976','Masala dosa'),
 ('plain-dosa','https://images.unsplash.com/photo-1694849789325-914b71ab4075','Plain dosa & coconut chutney'),
 ('idli-sambar','https://images.unsplash.com/photo-1589301760014-d929f3979dbc','Idli sambar (3)'),
 ('south-indian-meals','https://images.unsplash.com/photo-1625398407796-82650a8c135f','South Indian meals'),
 ('mini-thali','https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5','Mini thali'),
 ('dal-palak-phulka','https://images.unsplash.com/photo-1767114915936-745dd372f1d8','Dal palak with phulkas'),
 ('veg-pulao-raita','https://images.unsplash.com/photo-1588644525273-f37b60d78512','Veg pulao & raita'),
 ('home-chicken-curry','https://images.unsplash.com/photo-1565557623262-b51c2513a641','Home-style chicken curry'),
 ('millet-pongal','https://images.unsplash.com/photo-1633383718081-22ac93e3db65','Little millet pongal'),
 ('samosa','https://images.unsplash.com/photo-1601050690597-df0568f70950','Samosa (2)'),
 ('paneer-butter-masala','https://images.unsplash.com/photo-1585937421612-70a008356fbe','Paneer butter masala'),
 ('chicken-ghee-roast','https://images.unsplash.com/photo-1565557623262-b51c2513a641','Chicken ghee roast'),
 ('hyderabadi-dum-biryani','https://images.unsplash.com/photo-1589302168068-964664d93dc0','Hyderabadi dum biryani'),
 ('foxtail-millet-khichdi','https://images.unsplash.com/photo-1633383718081-22ac93e3db65','Foxtail millet khichdi'),
 ('home-style-veg-thali','https://images.unsplash.com/photo-1742281257687-092746ad6021','Home-style veg thali'),
 ('ragi-mudde-soppu-saaru','https://images.unsplash.com/photo-1618449840665-9ed506d73a34','Ragi mudde and soppu saaru'),
 ('butter-naan','https://images.unsplash.com/photo-1567337710282-00832b415979','Butter naan'),
 ('dal-makhani','https://images.unsplash.com/photo-1767114915989-c6ab3c8fc42e','Dal makhani')
) as v(slug, url, alt) join public.products p on p.slug = v.slug
where not exists (select 1 from public.product_media m where m.product_id = p.id);

-- show the most photogenic dishes on the homepage
update public.products set show_on_home = true where slug in ('paneer-butter-masala','hyderabadi-dum-biryani','masala-dosa','south-indian-meals');

-- homepage + kitchen page text
insert into public.site_sections (key, position, is_enabled, content) values
 ('hero', 1, true, '{"eyebrow":"Home-cooked in Bengaluru","title":"Your everyday meal,\ncooked like home.","body":"MOOROOTA cooks fresh, balanced Indian meals every day in small batches: soft phulkas, slow-cooked dals, millet bowls and weekend biryani. Order tonight’s dinner, or let us take care of breakfast, lunch and dinner with a meal plan.","primaryCta":"Order now","secondaryCta":"Explore meal plans","imagePublicId":"https://images.unsplash.com/photo-1589778655375-3e622a9fc91c","chips":"Cooked to order, Veg & non-veg, Breakfast · lunch · dinner, Millets every day"}'::jsonb),
 ('marquee', 2, true, '{"label":"On the stove today"}'::jsonb),
 ('cooker', 3, true, '{"eyebrow":"Why MOOROOTA is different","title":"Open it up. Every layer is on purpose.","body":"A real cooker, taken apart as you scroll. Each part stands for one promise our kitchen keeps, every single day."}'::jsonb),
 ('homemade', 4, true, '{"eyebrow":"Our food","title":"Tastes like someone at home made it. Because someone did.","body":"Our cooks make food the way they make it for their own families. Dal is soaked the night before and tempered fresh. Rotis are rolled by hand. Masalas are roasted and ground in our kitchen every week, never poured from a packet.","body2":"We cook the everyday food of Karnataka, Andhra, Tamil Nadu, Kerala and the North: the dishes you grew up eating, not restaurant versions. Less oil, less cream, more vegetables, and the same honest taste every day.","imagePublicId":"https://images.unsplash.com/photo-1715000938476-2b587d4482f5","timelineTitle":"A day in our kitchen","timeline":[{"title":"5:30 AM","body":"Vegetables, greens and paneer arrive, checked and washed."},{"title":"6:30 AM","body":"Batter fermented overnight goes on the tawa for breakfast."},{"title":"9:30 AM","body":"Dals go on the stove. The day’s masalas are roasted and ground."},{"title":"11:30 AM","body":"Lunch is plated to order and sealed at the pass."},{"title":"4:00 PM","body":"Deep clean and temperature checks between services."},{"title":"7:00 PM","body":"Dinner cooks in small batches, so it reaches you hot."}],"points":[{"title":"Cold-pressed oils, used lightly","body":"Groundnut and coconut oil, measured, never reused."},{"title":"Spices ground in our kitchen","body":"Masalas roasted and ground each week, like at home."},{"title":"No preservatives, colours or MSG","body":"If you wouldn’t add it at home, we don’t either."},{"title":"Millets, dals and greens daily","body":"Ragi, foxtail millet and seasonal soppu on the menu every day."}]}'::jsonb),
 ('plate', 5, true, '{"eyebrow":"What’s on your plate","title":"A complete meal, the way it should be.","body":"Every MOOROOTA lunch and dinner is a balanced plate: protein, fibre, good carbs and something fresh. This is what a typical everyday thali holds.","imagePublicId":"https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5","items":[{"title":"Dal of the day","body":"Toor, moong or masoor, rotating daily. Your protein."},{"title":"Seasonal sabzi","body":"One dry, one with gravy, from what came in fresh that morning."},{"title":"Phulkas or rice","body":"Hand-rolled whole-wheat phulkas, rice, or millet on some days."},{"title":"Curd and salad","body":"Curd set in our kitchen overnight, with a crunchy kosambari."},{"title":"Chutney or pickle","body":"Made in-house in small jars, like at home."},{"title":"Something sweet","body":"On some days, a small payasam or kheer."}],"note":"Calories and protein are listed on every dish in the menu."}'::jsonb),
 ('healthy', 6, true, '{"eyebrow":"Healthy & light","title":"Good for you, and still delicious.","body":"Millet khichdi, sprout bowls, ragi mudde and lentil chillas: light food that keeps you full. Calories, protein and ingredients are listed on every dish, so you always know what you’re eating.","tag":"Healthy"}'::jsonb),
 ('plans', 7, true, '{"eyebrow":"Meal plans","title":"Your everyday meal, every single day.","body":"Stop thinking about what’s for lunch. Pick a plan and we cook and deliver breakfast, lunch or dinner to your door daily, with a menu that changes every day so you never get bored."}'::jsonb),
 ('plans_how', 8, true, '{"eyebrow":"How meal plans work","title":"Set it up once. Eat well all month.","steps":[{"title":"Choose your plan","body":"Two meals, full day, or light & healthy. Weekly or monthly, veg or non-veg."},{"title":"Tell us your taste","body":"Less spicy, no onion-garlic, Jain or no dairy. Pick a start date and address."},{"title":"We cook and deliver daily","body":"A rotating four-week menu, delivered hot and sealed in the time slot you chose."},{"title":"Skip or pause anytime","body":"Travelling or eating out? Skip a meal or pause from your account. Paused days are added to the end."}],"perks":"No delivery fee on plans, New menu every day, Skip before 9 PM the night before, Pause and resume anytime"}'::jsonb),
 ('signatures', 9, true, '{"eyebrow":"Kitchen favourites","title":"Dishes we’re known for"}'::jsonb),
 ('how', 10, true, '{"eyebrow":"Ordering takes a minute","title":"From our stove to your door.","steps":[{"title":"Choose your meal","body":"Browse today’s menu, pick add-ons and leave a note for the cook: less spicy, no onion, extra chutney."},{"title":"Pay securely","body":"Your order goes to the kitchen the moment your payment is confirmed. The price you see is the price you pay."},{"title":"Track it live","body":"Watch your food go from the stove to the rider, with an arrival time that updates by itself."}]}'::jsonb),
 ('faq', 11, true, '{"eyebrow":"Questions","title":"Good to know","items":[{"title":"Where do you deliver?","body":"Across our delivery area in Bengaluru. Add your address at checkout and we’ll tell you instantly whether we reach you."},{"title":"Is the food really homemade?","body":"Yes. It’s cooked fresh in small batches by our cooks, with home recipes, hand-rolled rotis and masalas ground in our kitchen. No frozen gravies, no reheating."},{"title":"How healthy is it?","body":"We cook with cold-pressed oils in small amounts, add no preservatives, colours or MSG, and put millets, dals and greens on the menu every day. Calories and protein are listed on each dish."},{"title":"Can I skip or pause my meal plan?","body":"Yes. Skip any meal or pause the whole plan from your account before the cut-off. Paused days are added to the end, so you never lose a meal you paid for."},{"title":"Do you have Jain, no onion-garlic or less-spicy food?","body":"Yes. Choose your preferences when you start a plan, or leave a note for the cook on any order."},{"title":"How do I pay?","body":"Securely online at checkout. Your order is confirmed as soon as the payment goes through."},{"title":"What if something is wrong with my order?","body":"Tell us within two hours of delivery and we’ll replace it or refund you. Our refund policy has the details."}]}'::jsonb),
 ('closing', 12, true, '{"title":"Hungry yet?","body":"Tonight’s menu is ready and the stove is on. Order a dish in under a minute, or start a meal plan and never think about what’s for lunch again.","cta":"Order now","secondaryCta":"Start a meal plan","promises":"Cooked to order, Sealed at the kitchen, Tracked to your door"}'::jsonb),
 ('kitchen_page', 100, true, '{"eyebrow":"Our kitchen","title":"A small kitchen that cooks like a home.","body":"MOOROOTA started with one simple idea: people in Bengaluru deserve everyday food that tastes like home, made honestly and delivered on time.","imagePublicId":"https://images.unsplash.com/photo-1715000938476-2b587d4482f5","story":[{"title":"Why we started","body":"Most of us moved to this city for work and left our mothers’ kitchens behind. Ordering in meant rich restaurant food that felt heavy by Wednesday. Cooking every day meant giving up our evenings."},{"title":"What we built","body":"So we built the kitchen we wanted to eat from: a small team of home cooks, a short menu that changes daily, and recipes from Karnataka, Andhra, Tamil Nadu, Kerala and the North, cooked the way they are at home."},{"title":"How we keep it that way","body":"We still cook in small batches, taste every pot before it leaves, and change the menu every day. That’s the whole secret."}],"quote":"If we wouldn’t serve it to our own family, it doesn’t leave the kitchen.","sourcing":[{"title":"Vegetables and greens","body":"Bought every morning from markets and farms around Bengaluru. What we don’t use, we don’t serve tomorrow."},{"title":"Grains and millets","body":"Sona masuri rice, whole-wheat atta, ragi, foxtail and little millet from suppliers we know."},{"title":"Dairy and paneer","body":"Fresh milk and paneer every day. Curd is set in our own kitchen overnight."},{"title":"Oils and spices","body":"Cold-pressed groundnut and coconut oil. Whole spices, roasted and ground in-house every week."}],"hygiene":[{"title":"Caps, masks and gloves","body":"Worn by everyone on the line, every shift."},{"title":"Temperatures logged","body":"Fridges and hot food are checked and recorded through the day."},{"title":"Cleaned between services","body":"Surfaces, utensils and floors are deep-cleaned after every meal service."},{"title":"Sealed for you","body":"Every box is sealed at the pass and opened only by you."},{"title":"Licensed and inspected","body":"FSSAI licensed. Our licence number is shown at the bottom of every page."}],"team":{"title":"The people who cook for you","body":"Our cooks come from home kitchens across South and North India. Each one owns a handful of recipes and cooks them every day, so your dal tastes the same on Monday as it did last Friday."}}'::jsonb)
on conflict (key) do update set content = excluded.content, position = excluded.position, is_enabled = true, updated_at = now();

-- a sample week for each meal plan (edit in Admin > Meal plans > plan > Rotating menu)
insert into public.plan_menu (plan_id, week, weekday, meal, custom_name)
select p.id, 1, v.weekday, v.meal, v.name from (values
 ('two-meals',0,'LUNCH','Dal tadka, beans palya, rice, 2 phulkas, curd'),
 ('two-meals',0,'DINNER','Moong dal, mixed veg, phulkas'),
 ('full-day',0,'BREAKFAST','Idli sambar'),
 ('full-day',0,'LUNCH','Dal tadka, beans palya, rice, 2 phulkas, curd'),
 ('full-day',0,'DINNER','Moong dal, mixed veg, phulkas'),
 ('light-healthy',0,'LUNCH','Ragi mudde, soppu saaru'),
 ('two-meals',1,'LUNCH','Rajma, jeera rice, phulka, salad'),
 ('two-meals',1,'DINNER','Veg pulao, raita'),
 ('full-day',1,'BREAKFAST','Kanda poha'),
 ('full-day',1,'LUNCH','Rajma, jeera rice, phulka, salad'),
 ('full-day',1,'DINNER','Veg pulao, raita'),
 ('light-healthy',1,'LUNCH','Foxtail millet khichdi'),
 ('two-meals',2,'LUNCH','Sambar, cabbage palya, rice, rasam, curd'),
 ('two-meals',2,'DINNER','Paneer bhurji, phulkas, dal'),
 ('full-day',2,'BREAKFAST','Masala dosa'),
 ('full-day',2,'LUNCH','Sambar, cabbage palya, rice, rasam, curd'),
 ('full-day',2,'DINNER','Paneer bhurji, phulkas, dal'),
 ('light-healthy',2,'LUNCH','Sprout bowl, millet roti'),
 ('two-meals',3,'LUNCH','Dal palak, aloo gobi, phulkas, rice'),
 ('two-meals',3,'DINNER','Millet khichdi, kadhi'),
 ('full-day',3,'BREAKFAST','Rava upma'),
 ('full-day',3,'LUNCH','Dal palak, aloo gobi, phulkas, rice'),
 ('full-day',3,'DINNER','Millet khichdi, kadhi'),
 ('light-healthy',3,'LUNCH','Little millet pongal'),
 ('two-meals',4,'LUNCH','Bisi bele bath, raita, papad'),
 ('two-meals',4,'DINNER','Dal fry, bhindi, phulkas'),
 ('full-day',4,'BREAKFAST','Ragi dosa'),
 ('full-day',4,'LUNCH','Bisi bele bath, raita, papad'),
 ('full-day',4,'DINNER','Dal fry, bhindi, phulkas'),
 ('light-healthy',4,'LUNCH','Moong chilla, salad'),
 ('two-meals',5,'LUNCH','Chole, phulkas, rice, kosambari'),
 ('two-meals',5,'DINNER','Veg kurma, chapati, rice'),
 ('full-day',5,'BREAKFAST','Moong dal chilla'),
 ('full-day',5,'LUNCH','Chole, phulkas, rice, kosambari'),
 ('full-day',5,'DINNER','Veg kurma, chapati, rice'),
 ('light-healthy',5,'LUNCH','Dal palak, 2 phulkas'),
 ('two-meals',6,'LUNCH','South Indian meals with payasam'),
 ('two-meals',6,'DINNER','Veg dum biryani, salan'),
 ('full-day',6,'BREAKFAST','Pongal & vada'),
 ('full-day',6,'LUNCH','South Indian meals with payasam'),
 ('full-day',6,'DINNER','Veg dum biryani, salan'),
 ('light-healthy',6,'LUNCH','Millet bisi bele bath')
) as v(slug, weekday, meal, name) join public.meal_plans p on p.slug = v.slug
on conflict (plan_id, week, weekday, meal) do nothing;

update public.meal_plans set delivery_slots = '{"BREAKFAST":"7:30–8:30 AM","LUNCH":"12:30–1:30 PM","DINNER":"7:30–8:30 PM"}'::jsonb where delivery_slots = '{}'::jsonb or delivery_slots is null;
