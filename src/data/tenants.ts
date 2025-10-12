export interface Tenant {
  id: string;
  name: string;
  contact: string;
  landlord: string;
  landlordContact: string;
  address: string;
  status: 'active' | 'pending' | 'review';
  paymentStatus: 'paid' | 'overdue' | 'pending';
  performance: number; // 0-100
}

export const tenants: Tenant[] = [
  { id: '1', name: 'Namyenya Winnie', contact: '742094463', landlord: 'Justine', landlordContact: '753875749', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 95 },
  { id: '2', name: 'Namakula Sophie', contact: '706592528', landlord: 'Seruma Julius', landlordContact: '708642940', address: 'Baita', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '3', name: 'Namugenyi Juliet', contact: '755384326', landlord: 'Mukwanga Saddick', landlordContact: '747221252', address: 'Bugabo', status: 'active', paymentStatus: 'pending', performance: 92 },
  { id: '4', name: 'Nantume Sophia', contact: '761849518', landlord: 'Mariam Nalweyiso', landlordContact: '705380177', address: 'Bugabo', status: 'active', paymentStatus: 'paid', performance: 90 },
  { id: '5', name: 'Tuhirirwe Regina', contact: '757437046', landlord: 'Adellah Twikirize', landlordContact: '701889945', address: 'Kasenyi', status: 'active', paymentStatus: 'paid', performance: 85 },
  { id: '6', name: 'Nanyondo Justine', contact: '742884112', landlord: 'Seruma Julius', landlordContact: '708642940', address: 'Kasenyi', status: 'review', paymentStatus: 'overdue', performance: 65 },
  { id: '7', name: 'Mwanje Henry', contact: '743819713', landlord: 'Ssekiziyivu Ronald', landlordContact: '782354628', address: 'Kawafu', status: 'active', paymentStatus: 'paid', performance: 93 },
  { id: '8', name: 'Kayanja Hellen', contact: '753317368', landlord: 'Ngobi', landlordContact: '752443668', address: 'Kigungu', status: 'active', paymentStatus: 'paid', performance: 87 },
  { id: '9', name: 'Nakakande Monica', contact: '752227363', landlord: 'Nabuuma Solome', landlordContact: '772486073', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 91 },
  { id: '10', name: 'Nalunkuma Justin', contact: '759648561', landlord: 'Nabosa Scovia', landlordContact: '743375669', address: 'Kitala', status: 'pending', paymentStatus: 'pending', performance: 78 },
  { id: '11', name: 'Najjingo Aisha', contact: '756137690', landlord: 'Mukisa Faith', landlordContact: '745135321', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 94 },
  { id: '12', name: 'Kasimaggwa Jamil Muhammad', contact: '747014156', landlord: 'Allan Sentongo', landlordContact: '709105519', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 89 },
  { id: '13', name: 'Mwanje Ibra', contact: '701234524', landlord: 'Kisubi Diana', landlordContact: '770527306', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 86 },
  { id: '14', name: 'Nalubega Peninah', contact: '700877060', landlord: 'Nakazibwe Betty', landlordContact: '755406768', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 90 },
  { id: '15', name: 'Nakiyana Scovia', contact: '702606966', landlord: 'Kabuga Brian', landlordContact: '762518508', address: 'Kitala', status: 'review', paymentStatus: 'overdue', performance: 70 },
  { id: '16', name: 'Nanteza Joyce', contact: '754197205', landlord: 'Nabuumba Solome', landlordContact: '772486073', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 92 },
  { id: '17', name: 'Balikanda Andrew', contact: '740841609', landlord: 'Richard Kawungu', landlordContact: '752660257', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '18', name: 'Catherine Joyce Aneno', contact: '702046578', landlord: 'Nakachwa Elizabeth', landlordContact: '701959210', address: 'Kitubulu', status: 'active', paymentStatus: 'paid', performance: 91 },
  { id: '19', name: 'Nalumu Zaituni', contact: '706257607', landlord: 'Aneno Beatrice', landlordContact: '773084995', address: 'Kitubulu', status: 'active', paymentStatus: 'pending', performance: 84 },
  { id: '20', name: 'Bogere Zakaliya', contact: '787037630', landlord: 'Mugulumu', landlordContact: '774033851', address: 'Kitubulu', status: 'active', paymentStatus: 'paid', performance: 87 },
  { id: '21', name: 'Kyaterekera Tom', contact: '708019355', landlord: 'Papa Halima', landlordContact: '705392134', address: 'Kitubulu', status: 'pending', paymentStatus: 'pending', performance: 75 },
  { id: '22', name: 'Nagawa Jollin', contact: '744103043', landlord: 'Kempisi Zubeda', landlordContact: '700196471', address: 'Kiwafu', status: 'active', paymentStatus: 'paid', performance: 93 },
  { id: '23', name: 'Nabasumba Juliet', contact: '709819237', landlord: 'Nabihogo Oliver', landlordContact: '708215368', address: 'Lugonjo', status: 'active', paymentStatus: 'paid', performance: 89 },
  { id: '24', name: 'Kiyingi Abdul', contact: '769156574', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'active', paymentStatus: 'paid', performance: 90 },
  { id: '25', name: 'Juuko Paul', contact: '702273378', landlord: 'Lubega Shafic', landlordContact: '701856117', address: 'Lyamutundwe', status: 'active', paymentStatus: 'paid', performance: 86 },
  { id: '26', name: 'Ndagire Sumayiyah Bilali', contact: '769037562', landlord: 'Najjuma Sharifah', landlordContact: '705027272', address: 'Makindye', status: 'active', paymentStatus: 'paid', performance: 94 },
  { id: '27', name: 'Irachan Pia', contact: '0757676945', landlord: 'Ogine Mungu', landlordContact: '765866525', address: 'Manyango', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '28', name: 'Lukwago Ibrahim', contact: '704815621', landlord: 'Mumbeja', landlordContact: '751394121', address: 'Mpala', status: 'active', paymentStatus: 'paid', performance: 91 },
  { id: '29', name: 'Mwesigye Peter', contact: '702785238', landlord: 'Kafuuma Jack', landlordContact: '706529191', address: 'Mpala', status: 'review', paymentStatus: 'overdue', performance: 68 },
  { id: '30', name: 'Dafin Nayebare', contact: '759839432', landlord: 'Salongo Kate', landlordContact: '753001143', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 92 },
  { id: '31', name: 'Shallot Amutuhaire', contact: '741904737', landlord: 'Nakabugo Florence', landlordContact: '751612906', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 87 },
  { id: '32', name: 'Higenyi Robert', contact: '0703458843', landlord: 'Migadde Simon', landlordContact: '758257049', address: 'Nakiwogo', status: 'active', paymentStatus: 'paid', performance: 89 },
  { id: '33', name: 'Nakanwagi Lydia', contact: '708206856', landlord: 'Nabulya Irene', landlordContact: '700305227', address: 'Nkumba', status: 'active', paymentStatus: 'paid', performance: 90 },
  { id: '34', name: 'Asiimwe Alex', contact: '770432534', landlord: 'Miiro Prossy', landlordContact: '702240576', address: 'Kitala', status: 'pending', paymentStatus: 'pending', performance: 76 },
  { id: '35', name: 'Naluwugge Juliet', contact: '741404687', landlord: 'Kusaba Sylvia', landlordContact: '744231104', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 93 },
  { id: '36', name: 'Wanyeze Christine', contact: '754715140', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 85 },
  { id: '37', name: 'Nalongo Babirye', contact: '7767148822', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 88 },
  { id: '38', name: 'Nuwahereza Doreen', contact: '748805116', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'pending', performance: 82 },
  { id: '39', name: 'Nalumansi Marium', contact: '705472340', landlord: 'N/A', landlordContact: 'N/A', address: 'Kitala', status: 'active', paymentStatus: 'paid', performance: 91 },
];
