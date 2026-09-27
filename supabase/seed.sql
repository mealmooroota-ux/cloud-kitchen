-- Starter content. Every row here is editable in the admin portal (/admin).
-- Prices are SAMPLE values: change them in Admin > Products and Admin > Meal plans before going live.

insert into public.categories (name, slug, position) values
 ('Healthy & light','healthy',1),('Homestyle','homestyle',2),('Curries','curries',3),('Biryani & rice','biryani',4),('Breads','breads',5),('Desserts','desserts',6)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, price_paise, is_veg, prep_minutes, serves, tags, show_on_home, in_plan_rotation, position)
select c.id, p.name, p.slug, p.description, p.price, p.veg, p.prep, p.serves, p.tags, p.home, p.plan, p.pos
from (values
 ('curries','Paneer butter masala','paneer-butter-masala','Fresh cottage cheese, lightly charred, folded into a slow tomato-butter gravy with cashew and kasuri methi.',32900,true,18,'1–2','{Homestyle}'::text[],true,true,1),
 ('curries','Dal makhani','dal-makhani','Black lentils simmered overnight, finished with a little cream.',25900,true,15,'2','{Homestyle}',true,true,2),
 ('curries','Chicken ghee roast','chicken-ghee-roast','Mangalorean roast in byadgi chilli, ghee and curry leaves.',37900,false,25,'1–2','{}',true,false,3),
 ('biryani','Hyderabadi dum biryani','hyderabadi-dum-biryani','Long-grain basmati sealed with saffron and slow-steamed.',39900,false,30,'2','{}',true,false,1),
 ('healthy','Ragi mudde & soppu saaru','ragi-mudde-soppu-saaru','Finger-millet balls with a greens and lentil saaru.',19900,true,15,'1','{Healthy,Millet,"High fibre"}',false,true,1),
 ('healthy','Foxtail millet khichdi','foxtail-millet-khichdi','Millet, moong dal and vegetables, tempered in ghee.',21900,true,15,'1','{Healthy,Millet,"Low oil"}',false,true,2),
 ('healthy','Grilled paneer & sprouts bowl','grilled-paneer-sprouts-bowl','Paneer, sprouts, cucumber and a mint-curd dressing.',26900,true,12,'1','{Healthy,"High protein"}',false,true,3),
 ('healthy','Moong dal chilla','moong-dal-chilla','Two savoury lentil pancakes with green chutney.',16900,true,12,'1','{Healthy,"High protein","Low oil"}',false,true,4),
 ('homestyle','Home-style veg thali','home-style-veg-thali','Dal, sabzi, rice, two phulkas, salad and curd. Changes daily.',24900,true,15,'1','{Homestyle}',false,true,1),
 ('homestyle','Rajma chawal','rajma-chawal','Slow-cooked kidney beans with steamed rice.',21900,true,15,'1','{Homestyle}',false,true,2),
 ('breads','Butter naan','butter-naan','Tandoor-baked, brushed with butter.',6000,true,8,'1','{}',false,false,1),
 ('desserts','Gulab jamun (2)','gulab-jamun','Soft khoya dumplings in cardamom syrup.',12900,true,2,'1–2','{}',false,false,1)
) as p(cat, name, slug, description, price, veg, prep, serves, tags, home, plan, pos)
join public.categories c on c.slug = p.cat
on conflict (slug) do nothing;

-- add-on example
with pr as (select id from public.products where slug = 'paneer-butter-masala'),
g as (insert into public.addon_groups (product_id, name, min_select, max_select, position) select id, 'Choose a bread', 0, 1, 1 from pr returning id)
insert into public.addons (group_id, name, price_paise, position) select g.id, a.name, a.price, a.pos from g, (values ('Butter naan',6000,1),('Garlic naan',7000,2),('Malabar parotta',6000,3)) a(name,price,pos);

insert into public.meal_plans (slug, name, label, description, meals, features, veg_option, nonveg_option, highlight, position) values
 ('two-meals','Two meals','Lunch + dinner','For busy weekdays.','{LUNCH,DINNER}','{"Lunch and dinner, every day","Menu rotates daily","Veg or non-veg"}',true,true,false,1),
 ('full-day','Full day','Breakfast + lunch + dinner','Everything, taken care of.','{BREAKFAST,LUNCH,DINNER}','{"All three meals, every day","Menu rotates daily","Veg or non-veg","Delivery slots you choose"}',true,true,true,2),
 ('light-healthy','Light & healthy','Lunch, millet-based','Lighter, balanced plates.','{LUNCH}','{"Millet and dal based lunches","Calories listed on every meal","Veg only"}',true,false,false,3)
on conflict (slug) do nothing;

insert into public.meal_plan_prices (plan_id, duration_days, label, veg_price_paise, nonveg_price_paise)
select p.id, d.days, d.label, d.veg, d.nonveg from public.meal_plans p
join (values
 ('two-meals',7,'1 week',280000,340000),('two-meals',30,'1 month',1100000,1350000),
 ('full-day',7,'1 week',390000,460000),('full-day',30,'1 month',1500000,1800000),
 ('light-healthy',7,'1 week',150000,null),('light-healthy',30,'1 month',580000,null)
) d(slug,days,label,veg,nonveg) on d.slug = p.slug
on conflict (plan_id, duration_days) do nothing;

insert into public.cooker_layers (key, position, name, title, body) values
 ('vent',1,'Steam vent','Cooked to order, never reheated','Your dish starts cooking when you order it. Nothing waits under a heat lamp.'),
 ('lid',2,'Lid','Sealed at the pass','Every box is closed and tamper-sealed in the kitchen, and opened only by you.'),
 ('rice',3,'Rice','Bought fresh every morning','Vegetables, paneer and grains arrive daily. What we don’t use, we don’t serve tomorrow.'),
 ('pot',4,'Inner pot','Slow-cooked in small batches','Gravies simmer for hours in small pots, so flavour builds instead of being rushed.'),
 ('plate',5,'Heating plate','A hygiene-certified kitchen','Temperature-logged, inspected and cleaned to a schedule you can ask to see.'),
 ('base',6,'Base','Tracked from stove to door','Live status and a routed ETA, so you know exactly when to set the table.')
on conflict (key) do nothing;

insert into public.site_sections (key, position, is_enabled, content) values
 ('hero',1,true,'{"eyebrow":"A cloud kitchen in Bengaluru","title":"Slow-cooked.\nFast to you.","body":"Homemade, healthy meals cooked to order in small batches. Order a single dish or get breakfast, lunch and dinner every day with a meal plan.","primaryCta":"Order now","secondaryCta":"See meal plans","imagePublicId":""}'),
 ('cooker',2,true,'{"eyebrow":"Why ours is better","title":"Open it up. Every layer is on purpose.","body":"A real cooker, taken apart as you scroll. Each part is one promise we keep in the kitchen."}'),
 ('homemade',3,true,'{"eyebrow":"Homemade, every day","title":"Tastes like someone at home made it. Because someone did.","body":"Our cooks make food the way they make it for their own families: fresh dal every morning, rotis rolled by hand, and nothing out of a packet.","imagePublicId":"","points":[{"title":"Cold-pressed oils, used lightly","body":"Groundnut and coconut oil, measured, never reused."},{"title":"Spices ground in our kitchen","body":"Masalas roasted and ground each week, like at home."},{"title":"No preservatives, colours or MSG","body":"If you wouldn’t add it at home, we don’t either."},{"title":"Millets, dals and greens daily","body":"Ragi, foxtail millet and seasonal soppu on the menu every day."}]}'),
 ('healthy',4,true,'{"eyebrow":"Healthy & light","title":"Good for you, and still delicious","body":"Calories, protein and ingredients are listed on every dish, so you always know what you’re eating.","tag":"Healthy"}'),
 ('plans',5,true,'{"eyebrow":"Meal plans","title":"Home food, every day, without the cooking","body":"Pick your meals and we deliver them daily. Pause, skip or change any day from your account."}'),
 ('signatures',6,true,'{"eyebrow":"Tonight’s signatures","title":"Dishes we’re known for"}'),
 ('how',7,true,'{"steps":[{"title":"Choose your dishes","body":"Add-ons, spice and notes, priced by our server so totals are always right."},{"title":"Pay with UPI","body":"We confirm your payment with the bank before the kitchen starts."},{"title":"Watch it arrive","body":"See it cook, pack and ride, with an ETA that updates on its own."}]}'),
 ('closing',8,true,'{"title":"Hungry yet?","cta":"Order now"}')
on conflict (key) do nothing;
