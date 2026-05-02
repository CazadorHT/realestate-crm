
  -- 🛡️ CRM Hardening: Update Multilingual FAQ Translations (EN, CN, RU)
  -- Target Table: public.faqs

  BEGIN;

  -- 1. Transfer Costs
  UPDATE public.faqs SET 
    question_en = 'What are the expenses on the ownership transfer date?',
    answer_en = '<ul><li><strong>Transfer Fee:</strong> 2%</li><li><strong>Specific Business Tax:</strong> 3.3% (or <strong>Stamp Duty:</strong> 0.5%)</li><li><strong>Mortgage Registration Fee:</strong> 1% (if applying for a bank loan)</li><li><strong>Miscellaneous:</strong> Witness and application fees (minimal)</li></ul>Typically, buyers and sellers split these costs according to the sale agreement.',
    question_cn = '所有权过户当日有哪些费用？',
    answer_cn = '<ul><li><strong>过户费：</strong> 2%</li><li><strong>特种商业税：</strong> 3.3%（或 <strong>印花税：</strong> 0.5%）</li><li><strong>抵押登记费：</strong> 1%（若向银行办理贷款抵押）</li><li><strong>杂费：</strong> 见证费及申请费（金额较小）</li></ul>通常情况下，买卖双方将根据合同约定分担这些费用。',
    question_ru = 'Какие расходы предусмотрены при передаче права собственности?',
    answer_ru = '<ul><li><strong>Налог на переход права:</strong> 2%</li><li><strong>Специальный бизнес-налог:</strong> 3.3% (или <strong>Гербовый сбор:</strong> 0.5%)</li><li><strong>Регистрация ипотеки:</strong> 1% (если оформляется кредит)</li><li><strong>Прочее:</strong> Сборы за заверение и подачу заявления</li></ul>Обычно покупатель и продавец делят эти расходы по договоренности.'
  WHERE question LIKE '%ค่าใช้จ่ายในวันโอน%';

  -- 2. Exclusive Contract
  UPDATE public.faqs SET 
    question_en = 'Is there a binding contract for selling your house with us?',
    answer_en = 'We use an Exclusive Listing Agreement to ensure we can fully market your property. Typically, the contract period is 6-12 months, with no charges until the property is successfully sold.',
    question_cn = '委托我们售房是否有约束性合同？',
    answer_cn = '我们使用独家代理合同 (Exclusive) 以确保我们能全方位推广您的房产。合同期限通常为 6-12 个月，在房产成功售出前不收取任何费用。',
    question_ru = 'Есть ли обязательный контракт при продаже дома через нас?',
    answer_ru = 'Мы используем эксклюзивный договор (Exclusive), чтобы обеспечить максимальное продвижение вашего объекта. Обычно срок договора составляет 6-12 месяцев, оплата производится только после продажи.'
  WHERE question LIKE '%สัญญาผูกมัด%';

  -- 3. Loan Rejection
  UPDATE public.faqs SET 
    question_en = 'If the loan is not approved, is the reservation fee refundable?',
    answer_en = 'In the event that the customer''s loan is rejected according to bank conditions and notification is provided within the timeframe specified in the contract, the company is happy to provide a full refund of the reservation fee.',
    question_cn = '如果贷款未获批准，预订费可以退还吗？',
    answer_cn = '如果客户贷款因银行条件被拒，并按照合同约定的时间内提前通知，公司将全额退还预订费。',
    question_ru = 'Если кредит не одобрен, возвращается ли сумма бронирования?',
    answer_ru = 'В случае, если кредит клиента не одобрен по условиям банка, и об этом было сообщено в сроки, указанные в договоре, компания возвращает сумму бронирования в полном объеме.'
  WHERE question LIKE '%กู้ไม่ผ่าน%';

  -- 4. Pets in Condo
  UPDATE public.faqs SET 
    question_en = 'Are pets allowed in condos?',
    answer_en = 'It depends on the regulations of each project''s juristic office. Some projects are Pet-friendly and allowed, while others strictly prohibit them. We recommend checking with management before renting or buying.',
    question_cn = '公寓可以养宠物吗？',
    answer_cn = '这取决于每个项目物业管理处的规定。有些项目是宠物友好 (Pet-friendly) 的，可以饲养；而有些项目则严禁饲养。建议在租房或买房前先咨询物业。',
    question_ru = 'Можно ли содержать домашних животных в кондоминиумах?',
    answer_ru = 'Это зависит от правил управляющей компании каждого проекта. Некоторые проекты допускают размещение с животными (Pet-friendly), другие строго запрещают. Рекомендуем уточнять этот вопрос заранее.'
  WHERE question LIKE '%เลี้ยงสัตว์%';

  -- 5. Foreigners Buying
  UPDATE public.faqs SET 
    question_en = 'Can foreigners buy property in Thailand?',
    answer_en = 'Foreigners can buy condominiums (within the 49% foreign quota). However, they cannot directly own land or houses, except under special investment conditions (BOI) or legal inheritance.',
    question_cn = '外国人可以在泰国买房吗？',
    answer_cn = '外国人可以购买公寓（比例不超 49%），但不能直接持有土地或独栋别墅，除非是根据 BOI 特别条件的投资或依法继承。',
    question_ru = 'Могут ли иностранцы покупать недвижимость в Таиланде?',
    answer_ru = 'Иностранцы могут покупать кондоминиумы (в пределах квоты 49%). Однако они не могут напрямую владеть землей или домами, за исключением инвестиций по условиям BOI или наследования.'
  WHERE question LIKE '%ชาวต่างชาติซื้อบ้าน%';

  -- 6. Average Selling Time
  UPDATE public.faqs SET 
    question_en = 'What is the average time it takes to sell a house?',
    answer_en = 'On average, properties in good locations and reasonably priced take about 3-6 months to sell. Properties priced above market value or in secondary locations may take 6-12 months or more.',
    question_cn = '售出房屋的平均周期是多久？',
    answer_cn = '平均而言，地段优越且价格合理的房产大约需要 3-6 个月售出。价格高于市场价或地段稍逊的房产可能需要 6-12 个月甚至更长时间。',
    question_ru = 'Сколько времени в среднем занимает продажа дома?',
    answer_ru = 'В среднем продажа объектов по разумной цене занимает около 3-6 месяцев. Объекты по цене выше рыночной или в менее востребованных районах могут продаваться от 6-12 месяцев и более.'
  WHERE question LIKE '%ระยะเวลาในการขาย%';

  COMMIT;
