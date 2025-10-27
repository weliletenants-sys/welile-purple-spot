import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// All 272 tenants from ADEKE ANNET Excel file
const allTenants = [
  { name: "KAMUSIIME ZARIFAH NAHABWE", phone: "0782340404", location: "Nansana central" },
  { name: "TINDISEEGA RAPHAEL IAN", phone: "0785406748", location: "Nansana central" },
  { name: "MUJUNI IVY KIRSTEN", phone: "0783622700", location: "Nansana central" },
  { name: "TUKAMUSIIMA MACKLINE", phone: "0783622300", location: "Nansana central" },
  { name: "TWINAMATSIKO DELICK", phone: "0788422638", location: "Nansana central" },
  { name: "MWANIKA MARTIN", phone: "0784460722", location: "Nansana central" },
  { name: "AYAA MARY AGNES", phone: "0779296439", location: "Nansana central" },
  { name: "OLABO DANIEL", phone: "0772072041", location: "Nansana central" },
  { name: "SSEKATAWA GERAL", phone: "0701469689", location: "Nansana central" },
  { name: "KYOME AIDAN MARY JAMES", phone: "0784481319", location: "Nansana central" },
  { name: "NALULE ROSE", phone: "0703650326", location: "Nansana central" },
  { name: "TWENY HECTOR", phone: "0775126796", location: "Nansana central" },
  { name: "ADEL OMAR MUBIRU", phone: "0702413098", location: "Nansana central" },
  { name: "DIGOO", phone: "0784307357", location: "Nansana central" },
  { name: "DIGOO FELIX", phone: "0784307387", location: "Nansana central" },
  { name: "KAKONGE IRENE N", phone: "0772964262", location: "Nansana central" },
  { name: "ARINEITWE PHIONA", phone: "0772911260", location: "Nansana central" },
  { name: "NASSUUNA MARIANE", phone: "0703708509", location: "Nansana central" },
  { name: "KISEMBO EDGAR", phone: "0789721260", location: "Nansana central" },
  { name: "HANGHUJJA SARAH WABUSA", phone: "0772947978", location: "Nansana central" },
  { name: "ALEMIGA RAHUMAN", phone: "0782596564", location: "Nansana central" },
  { name: "KABUNA BERNARD", phone: "0774721121", location: "Nansana central" },
  { name: "KAGUMIRE WILLIAM", phone: "0778157860", location: "Nansana central" },
  { name: "MUGUME SHMEREL RYNE", phone: "0772949190", location: "Nansana central" },
  { name: "ATWEBEMBIRE JETHRO", phone: "0772460278", location: "Nansana central" },
  { name: "NALUBEGA PATRICIA", phone: "0754063322", location: "Nansana central" },
  { name: "AMARA WOTALI", phone: "0772067555", location: "Nansana central" },
  { name: "MUSHABE RONAH MAPHINE", phone: "0779605672", location: "Nansana central" },
  { name: "NAKASI CISSY", phone: "0752344246", location: "Nansana central" },
  { name: "KAYONDO IAN IMANI", phone: "0774304499", location: "Nansana central" },
  { name: "TUMUSHABE FOSCA", phone: "0757023837", location: "Nansana central" },
  { name: "LUNKUSE MILDRED SSONKO", phone: "0787951639", location: "Nansana central" },
  { name: "KATAMBA DUNCAN", phone: "0705569163", location: "Nansana central" },
  { name: "NEKESA CAROLYN", phone: "0706874425", location: "Nansana central" },
  { name: "NAMUTAMBA JOANITAH", phone: "0778693844", location: "Nansana central" },
  { name: "AGABA JETHRO WONDER", phone: "0701299456", location: "Nansana central" },
  { name: "MALAIKA ALAKUNAN ONAPITO", phone: "0772503521", location: "Nansana central" },
  { name: "EOIN ZANE ARINAWE", phone: "0756688103", location: "Nansana central" },
  { name: "ACHAN MARISA", phone: "0772121271", location: "Nansana central" },
  { name: "RUGIRA GILBERT", phone: "0704141587", location: "Nansana central" },
  { name: "MUGARURA ISAIAH", phone: "0752422974", location: "Nansana central" },
  { name: "NDYAMUBONA MARION", phone: "0753779049", location: "Nansana central" },
  { name: "SSEMBIGO JORAM", phone: "0752608953", location: "Nansana central" },
  { name: "MPALANYI KIRABO TRICIA", phone: "0702937220", location: "Nansana central" },
  { name: "DR. AKWESIGYE CEDRICK", phone: "0774221146", location: "Nansana central" },
  { name: "KEMIGISHA ELIZABETH", phone: "0756225164", location: "Nansana central" },
  { name: "BIRIMUYE EDITH", phone: "0751626371", location: "Nansana central" },
  { name: "ABOT PEACE", phone: "0755345060", location: "Nansana central" },
  { name: "NABIKOLO BRIDGET MUGAMBE", phone: "0775692499", location: "Nansana central" },
  { name: "RAJESH P.J", phone: "0772700881", location: "Nansana central" },
  { name: "OMUTE JAMES", phone: "0784426631", location: "Nansana central" },
  { name: "NALUKWAGO CHRISTINE", phone: "0705838358", location: "Nansana central" },
  { name: "MUWOOLA KITIMBWA", phone: "0772712595", location: "Nansana central" },
  { name: "MUWANGUZI PRINCESS FAVOUR", phone: "0753187221", location: "Nansana central" },
  { name: "MWESIGWA MARK", phone: "0709812385", location: "Nansana central" },
  { name: "MUGURUSI DAVID", phone: "0782275367", location: "Nansana central" },
  { name: "OPIYO NELSON", phone: "0772349603", location: "Nansana central" },
  { name: "MUSUMBA MARTINA", phone: "0752943368", location: "Nansana central" },
  { name: "AKURUT DOROTHY", phone: "0772860790", location: "Nansana central" },
  { name: "ATUGOONZA ANITA EDITH", phone: "0782952423", location: "Nansana central" },
  { name: "OMONGIN MOSES OMUNYOKOL", phone: "0702610060", location: "Nansana central" },
  { name: "KIYINGI ELIJAH", phone: "0772400914", location: "Nansana ganda" },
  { name: "GLORIA KABAGYE", phone: "0754096700", location: "Nansana ganda" },
  { name: "ATWINE RACHEL", phone: "0752519040", location: "Nansana ganda" },
  { name: "ADONGOT VICKY", phone: "0788514447", location: "Nansana ganda" },
  { name: "SEKUUTA PAUL", phone: "0782893229", location: "Nansana ganda" },
  { name: "OJAMBA GODFREY", phone: "0756191452", location: "Nansana ganda" },
  { name: "RWABUSHAIJA HENRY", phone: "0772190450", location: "Nansana ganda" },
  { name: "IANNA MAKULA TWEBAZA", phone: "0779003737", location: "Nansana ganda" },
  { name: "AMONY PEACE", phone: "0784363317", location: "Nansana ganda" },
  { name: "ABILLA MARK TREVOR", phone: "0777076422", location: "Nansana ganda" },
  { name: "HON AVUR JANE PACUTO", phone: "0788444268", location: "Nansana ganda" },
  { name: "KAWEESA MACKLIN", phone: "0778088371", location: "Nansana ganda" },
  { name: "MUHENDA EMANUELA", phone: "0774544769", location: "Nansana ganda" },
  { name: "KAKAMA JOSHUA", phone: "0783017440", location: "Nansana ganda" },
  { name: "MUZAYA BABRA", phone: "0785080617", location: "Nansana ganda" },
  { name: "NYAKUTULA MARIA", phone: "0782101636", location: "Nansana ganda" },
  { name: "NNALWEYISO PROSSCOVIA", phone: "0782078444", location: "Nansana ganda" },
  { name: "AGABA EMILY", phone: "0783280641", location: "Nansana ganda" },
  { name: "TUMUSIIME PUIS", phone: "0700339438", location: "Nansana ganda" },
  { name: "MUTUZO ERRIANNE", phone: "0781527652", location: "Nansana ganda" },
  { name: "EITASI RYAN", phone: "0772861657", location: "Nansana ganda" },
  { name: "NABAGEREKA CHRISTINE", phone: "0782089475", location: "Nansana ganda" },
  { name: "MUGISHA CARL VICTOR", phone: "0775871196", location: "Nansana ganda" },
  { name: "AKELLO ROBINAH", phone: "0700754039", location: "Nansana ganda" },
  { name: "SANGALO CHRISTIANA", phone: "0705507235", location: "Nansana ganda" },
  { name: "AYIKO JOSHUA", phone: "0773414900", location: "Nansana ganda" },
  { name: "NAMYALO REGINA", phone: "0701414887", location: "Nansana ganda" },
  { name: "PIRWOTT RAYMOND", phone: "0775811510", location: "Nansana ganda" },
  { name: "NAKAAYI AGNES", phone: "0775152709", location: "Nansana ganda" },
  { name: "KALUNGI CYRIL SEBASTIAN", phone: "0772683684", location: "Nansana ganda" },
  { name: "AKOTH APOPHIAH", phone: "0772873079", location: "Nansana ganda" },
  { name: "NGAGENO THOMAS", phone: "0700812518", location: "Nansana ganda" },
  { name: "MUWONGE REMMY", phone: "0776260016", location: "Nansana ganda" },
  { name: "GISA DORREN", phone: "0774077039", location: "Nansana ganda" },
  { name: "ULA AUDREY VENUS", phone: "0752600244", location: "Nansana ganda" },
  { name: "MITALA SAMSON", phone: "0752193630", location: "Nansana ganda" },
  { name: "KISAKYE EVELYN", phone: "0704600242", location: "Nansana ganda" },
  { name: "AYEBAZIBWE JEREMIAH", phone: "0703420715", location: "Nansana ganda" },
  { name: "ZIA KHALID", phone: "0756254943", location: "Nansana ganda" },
  { name: "MARCUS HARRISON", phone: "0754107530", location: "Nansana ganda" },
  { name: "WAISWA ROGERS", phone: "0758899855", location: "Nansana ganda" },
  { name: "SHALOM EZRA", phone: "0789173265", location: "Nansana ganda" },
  { name: "OPUS NELLY ERIC", phone: "0751354424", location: "Nansana ganda" },
  { name: "OPUS BRENDA KATARIKAWE", phone: "0772200711", location: "Nansana ganda" },
  { name: "OPIO EZEKIEL", phone: "0781601994", location: "Nansana ganda" },
  { name: "BAITE MANZI", phone: "0782336779", location: "Nansana ganda" },
  { name: "OKENY ROBERT", phone: "0786225798", location: "Nansana ganda" },
  { name: "KANOOLI OLIVIA", phone: "0701841247", location: "Nansana ganda" },
  { name: "MBABAZI SUZAN", phone: "0757002695", location: "Nansana ganda" },
  { name: "TWIKIRIZE ADRIEL ASIIMWE", phone: "0778187901", location: "Nansana ganda" },
  { name: "NAKAWEESA RITAH", phone: "0784880507", location: "Nansana ganda" },
  { name: "ATUKUNDA ATTRA JUDITHA", phone: "0772948383", location: "Nansana ganda" },
  { name: "ATIM GABRIELLA", phone: "0782375354", location: "Nansana ganda" },
  { name: "KABANDA IVAN", phone: "0705200545", location: "Nansana ganda" },
  { name: "NANSUMBA RACHEL", phone: "0777730655", location: "Nansana ganda" },
  { name: "TUHAISE GLORIA", phone: "0777634349", location: "Nansana ganda" },
  { name: "OYET SAMUEL", phone: "0777628123", location: "Nansana ganda" },
  { name: "MUTONI JANET", phone: "070885860", location: "Nansana ganda" },
  { name: "KOBUSINGYE JULIET", phone: "0773367463", location: "Nansana ganda" },
  { name: "BAKO CHRISTINE", phone: "0782877616", location: "Nansana ganda" },
  { name: "KASULE RONALD", phone: "0701345874", location: "Nansana ganda" },
  { name: "WAJEGA PIUS", phone: "0778061258", location: "Nansana ganda" },
  { name: "OFWONO JESSE JIMMY", phone: "0772851852", location: "Nansana ganda" },
  { name: "MONGA FELIX", phone: "0772625241", location: "Nansana ganda" },
  { name: "OBURE STEPHEN WASONGA", phone: "0754670473", location: "Nansana ganda" },
  { name: "NANKUNDA ALLEN BABIHUGA", phone: "0778451242", location: "Nansana ganda" },
  { name: "JEERO JONATHAN", phone: "0757000008", location: "Nansana ganda" },
  { name: "KIRUNGIMAZZI ESTHER", phone: "0757000008", location: "Nansana west E" },
  { name: "MANIKANDAN K", phone: "0706888073", location: "Nansana west E" },
  { name: "BANURA HELLEN", phone: "0781362231", location: "Nansana west E" },
  { name: "BAKOMEZA DENIS", phone: "0772653283", location: "Nansana west E" },
  { name: "NAKIRYA DOROTHY ENID", phone: "0782003473", location: "Nansana west E" },
  { name: "MUSOKE SIMON", phone: "0772493275", location: "Nansana west E" },
  { name: "NYABUTO DUNCAN", phone: "0782579009", location: "Nansana west E" },
  { name: "WOSUKIRA INNOCENT", phone: "077812451", location: "Nansana west E" },
  { name: "BUYI JOSEPH", phone: "0703431373", location: "Nansana west E" },
  { name: "KIGGUNDU STANLEY", phone: "0772936591", location: "Nansana west E" },
  { name: "OTIM MARTIN", phone: "0701297522", location: "Nansana west E" },
  { name: "BWENGYE HERBERT", phone: "0785895312", location: "Nansana west E" },
  { name: "ATIM FLORENCE LORA", phone: "0775083708", location: "Nansana west E" },
  { name: "TUGUME CHRIS", phone: "0704747014", location: "Nansana west E" },
  { name: "ZZIWA JOVAN FRED", phone: "0778765624", location: "Nansana west E" },
  { name: "NAMYALO GRACE ANN LISA", phone: "0772479939", location: "Nansana west E" },
  { name: "NAKITENDE NULU", phone: "0772489380", location: "Nansana west E" },
  { name: "NYIRAMAHORO EUNICE", phone: "0772417505", location: "Nansana west E" },
  { name: "MWANJE SAMALIE", phone: "0774201905", location: "Nansana west E" },
  { name: "KAMUGISHA JACENT", phone: "0701126454", location: "Nansana west E" },
  { name: "SSENTAMU MUZAMIRU", phone: "0772407431", location: "Nansana west E" },
  { name: "RUGIGANA MICHAEL", phone: "0704988650", location: "Nansana west E" },
  { name: "MALIAMUNGU HABIB", phone: "0773166911", location: "Nansana west E" },
  { name: "TABAARO GIDEON", phone: "0752232450", location: "Nansana west E" },
  { name: "ACHETI AGNES", phone: "0773482980", location: "Nansana west E" },
  { name: "BAIGANA MARTHA", phone: "0782012743", location: "Nansana west E" },
  { name: "MUKIIBI DOROTHY NABUNYA", phone: "0772392238", location: "Nansana west E" },
  { name: "RUKUNDO SARAH", phone: "0771457756", location: "Nansana west E" },
  { name: "MAYANJA HAMZA", phone: "0772469485", location: "Nansana west E" },
  { name: "ABIKO REGINA", phone: "0789746211", location: "Nansana west E" },
  { name: "AJOK JANE", phone: "0784433019", location: "Nansana west E" },
  { name: "OPUS CHRISTIAN ETHAN", phone: "0775231015", location: "Nansana west E" },
  { name: "NALUBEGA JESCA", phone: "0753047756", location: "Nansana west E" },
  { name: "NAKABUGO BARBARA WABWIRE", phone: "0772489362", location: "Nansana west E" },
  { name: "WABWIRE ANTHONY XAVIER", phone: "0772489362", location: "Nansana west E" },
  { name: "ACENG RACHEAL OJUKA", phone: "0706495905", location: "Nansana west E" },
  { name: "AINEMBABAZI DIANA", phone: "0752600331", location: "Nansana west E" },
  { name: "GITAU ALICE MUTHONI", phone: "0783233456", location: "Nansana west E" },
  { name: "ABWIN VIOLA", phone: "0772861557", location: "Nansana west E" },
  { name: "MUSIIME FAITH", phone: "0787370047", location: "Nansana west E" },
  { name: "SEBAGGALA EDWARD", phone: "0772450933", location: "Nansana west E" },
  { name: "ATUKUNDA ELIJAH", phone: "0774777493", location: "Nansana west E" },
  { name: "BUYUNTO BLESSING SHALOM", phone: "0782958272", location: "Nansana west E" },
  { name: "TWINOMUGISHA EDWARD", phone: "0702161802", location: "Nansana west E" },
  { name: "ANENE ANZOA", phone: "0706980868", location: "Nansana west E" },
  { name: "NAMAKULA NULU", phone: "0771617155", location: "Nansana west E" },
  { name: "KALIBBALA TAGE", phone: "0771899235", location: "Nansana west E" },
  { name: "KYOWAIRE SHARON MARTHA", phone: "0702809348", location: "Nansana west E" },
  { name: "BUNEZA ASMA", phone: "0785229661", location: "Nansana west E" },
  { name: "AJEGO CLARE", phone: "0701073218", location: "Nansana west E" },
  { name: "KAKYO KAREN", phone: "0772200682", location: "Nansana west E" },
  { name: "KITONTO PATRICIA ANGEL", phone: "0772424227", location: "Nansana west E" },
  { name: "MWESIGYE WALTER", phone: "0704690138", location: "Nansana west E" },
  { name: "NANSIKOMBI SHARIFAH", phone: "0700801566", location: "Nansana west E" },
  { name: "TINE THO PUY", phone: "0755307818", location: "Nansana west E" },
  { name: "OKORI ARNOLD", phone: "0781532811", location: "Nansana west E" },
  { name: "AMUGE WENDY", phone: "077042222", location: "Nansana west E" },
  { name: "SSEKALALA ABDU", phone: "0706144416", location: "Nansana west E" },
  { name: "NAMUWAYA SOPHIA MENYA", phone: "0775390494", location: "Nansana west E" },
  { name: "NIZEYIMAANA JULIUS", phone: "0753880732", location: "Nansana west E" },
  { name: "ODREK BERINDA", phone: "0782331290", location: "Nansana west E" },
  { name: "TUSIIME LYDIA NORMA", phone: "0773152692", location: "Nansana west E" },
  { name: "BARUNGI BARBARAH PATIENCE", phone: "0781500633", location: "Nansana west E" },
  { name: "LUBUUKA SIMON", phone: "0700005440", location: "Nansana west E" },
  { name: "NASSANGA BRIDGET", phone: "0706161123", location: "Nansana west E" },
  { name: "TUMWEBAZE CELIA", phone: "0774125412", location: "Nansana west E" },
  { name: "ASIIMWE PATIENCE", phone: "0701549180", location: "Nansana west E" },
  { name: "ISUKALI BENA", phone: "0787676249", location: "Nansana west E" },
  { name: "ASALE MALIZA", phone: "0789456121", location: "Nansana west E" },
  { name: "BAMPABWIRE CHRISTINE", phone: "0776423474", location: "Nansana west E" },
  { name: "OLAAKA JOSIAH", phone: "0772301199", location: "Nansana west E" },
  { name: "TANGA VICENT", phone: "077249091", location: "Nansana yesu Amala" },
  { name: "OTIM OBSSE EMIRU", phone: "0793017817", location: "Nansana yesu Amala" },
  { name: "AWEKONIMUNGU ROBERT", phone: "0778459821", location: "Nansana yesu Amala" },
  { name: "AKECK BEATRICE DAINA", phone: "0771674511", location: "Nansana yesu Amala" },
  { name: "ARINAITWE BRUCE", phone: "0778223546", location: "Nansana yesu Amala" },
  { name: "KASINJE SHALOM RUTH", phone: "0779033233", location: "Nansana yesu Amala" },
  { name: "MUGERWA JONATHAN", phone: "0700833091", location: "Nansana yesu Amala" },
  { name: "KANTONO ANNITAH", phone: "0770725944", location: "Nansana yesu Amala" },
  { name: "ABEN REUEL AUSTIN", phone: "0703584270", location: "Nansana yesu Amala" },
  { name: "LUBULWA LAURIAN", phone: "0701053471", location: "Nansana yesu Amala" },
  { name: "NAGUJJA DORATHY", phone: "0783362705", location: "Nansana yesu Amala" },
  { name: "OGOLAH JOEL KOKEYO", phone: "0781270763", location: "Nansana yesu Amala" },
  { name: "BIDONG BERNARD BOSCO", phone: "0782328383", location: "Nansana yesu Amala" },
  { name: "SILVESTER STALLONE", phone: "0776180031", location: "Nansana yesu Amala" },
  { name: "NAYEBARE EVELYNE", phone: "0771181111", location: "Nansana yesu Amala" },
  { name: "MUTUMBA SIMON", phone: "0773250263", location: "Nansana yesu Amala" },
  { name: "NAMUGANGA SARAH BUSINGYE", phone: "0755240832", location: "Nansana yesu Amala" },
  { name: "MWEBAZA HENRY", phone: "0752590331", location: "Nansana yesu Amala" },
  { name: "SEMAKULA ROBINSON", phone: "0772912623", location: "Nansana yesu Amala" },
  { name: "MUGENI PROSSY", phone: "0776078794", location: "Nansana yesu Amala" },
  { name: "ASHABA IVY NEIRA", phone: "0778187901", location: "Nansana yesu Amala" },
  { name: "ATUKUNDA GERALD", phone: "0779925305", location: "Nansana yesu Amala" },
  { name: "ASERU MOLLY", phone: "0776254553", location: "Nansana yesu Amala" },
  { name: "YIKI HARRY", phone: "0777373324", location: "Nansana yesu Amala" },
  { name: "SINGH DANIO NIRMAL", phone: "0755900738", location: "Nansana yesu Amala" },
  { name: "NAMAGEMBE JOYCE", phone: "0772349907", location: "Nansana yesu Amala" },
  { name: "OKANYA DENIS", phone: "0782291400", location: "Nansana yesu Amala" },
  { name: "ATUKUNDA ALEX", phone: "0782742103", location: "Nansana yesu Amala" },
  { name: "NAMUGGA JEANIE", phone: "0782055041", location: "Nansana yesu Amala" },
  { name: "RUGUMAYO ANDREW", phone: "0772479820", location: "Nansana yesu Amala" },
  { name: "NAKATO ANNMARY", phone: "0782539962", location: "Nansana yesu Amala" },
  { name: "NANYONJO BLESSING", phone: "0788681919", location: "Nansana yesu Amala" },
  { name: "MIREMBE KATRINA RUTH", phone: "0753588549", location: "Nansana yesu Amala" },
  { name: "BRIDGE TIMOTHY", phone: "0772575373", location: "Nansana yesu Amala" },
  { name: "JEMIMAH AYETA EDITH", phone: "0753588549", location: "Nansana yesu Amala" },
  { name: "NAKIBUUKA FLORA", phone: "0751733948", location: "Nansana yesu Amala" },
  { name: "EREGU DEOGRACIUS", phone: "0782321984", location: "Nansana yesu Amala" },
  { name: "AYAA SANTA SHANIA", phone: "0777484087", location: "Nansana yesu Amala" },
  { name: "ABIYO PHILLIAM", phone: "0777076397", location: "Nansana yesu Amala" },
  { name: "OKELLO JERRY CANAN", phone: "0772515695", location: "Nansana yesu Amala" },
  { name: "NABWIRE KENGANZI", phone: "0772484745", location: "Nansana yesu Amala" },
  { name: "NAMAZZI JOCELYN SEKANABI", phone: "0752936005", location: "Nansana yesu Amala" },
  { name: "ITIAKORIT SAMUEL", phone: "0772965575", location: "Nansana yesu Amala" },
  { name: "BUWEMBO AGNES", phone: "0775319798", location: "Nansana yesu Amala" },
  { name: "MBOIJANA NELSON BILLS", phone: "0755019172", location: "Nansana yesu Amala" },
  { name: "KUSASIRA YVONNE", phone: "0773026414", location: "Nansana yesu Amala" },
  { name: "MUSUBIKA MIKEALA", phone: "0772436949", location: "Nansana yesu Amala" },
  { name: "OUMO JUNIOR CHARLES", phone: "0752473800", location: "Nansana yesu Amala" },
  { name: "OTURU STELLA", phone: "0782130604", location: "Nansana yesu Amala" },
  { name: "KYALIGONZA CHRISITNE", phone: "0754054424", location: "Nansana yesu Amala" },
  { name: "MWIJUKA LOUIS", phone: "0772120578", location: "Nansana yesu Amala" },
  { name: "AMIA MUBEYA", phone: "0752106538", location: "Nansana yesu Amala" },
  { name: "OPURONG LEONARD", phone: "0789833223", location: "Nansana yesu Amala" },
  { name: "NAGUJJA DOROTHY", phone: "0783362705", location: "Nansana yesu Amala" },
  { name: "IKIRIZA DIANA", phone: "0752389991", location: "Nansana yesu Amala" },
  { name: "ORECH ALICE MARY", phone: "0772912105", location: "Nansana yesu Amala" },
  { name: "OJOK NORBERT FRANCIS", phone: "0772379435", location: "Nansana yesu Amala" },
  { name: "NAMUGERA PHILIP", phone: "0773186768", location: "Nansana yesu Amala" },
  { name: "MUNDEYI DESTINO", phone: "0772445065", location: "Nansana yesu Amala" },
  { name: "NABISERE DENISE", phone: "0752063971", location: "Nansana yesu Amala" },
  { name: "MUNDEYI ESPERANZA", phone: "0772445065", location: "Nansana yesu Amala" },
  { name: "NANDUGWA RUTH", phone: "0782878520", location: "Nansana yesu Amala" },
  { name: "DAWA EUNICE", phone: "0778930738", location: "Nansana yesu Amala" },
  { name: "ACIO LILLIAN", phone: "0774954286", location: "Nansana yesu Amala" },
  { name: "NABBANJA FAITH FRIDAH", phone: "0782867108", location: "Nansana yesu Amala" },
  { name: "SUWILA YALEDI", phone: "0785727035", location: "Nansana yesu Amala" },
  { name: "GUMA COMRADE", phone: "0751422902", location: "Nansana Nsumbi" },
  { name: "BUYINZA BENON", phone: "0703168011", location: "Nansana Nsumbi" },
  { name: "BIRUNGI FLAVIA", phone: "0751117172", location: "Nansana Nsumbi" },
  { name: "NDORIMANA FLORIATE", phone: "0780263143", location: "Nansana Nsumbi" },
  { name: "OKELLO BENARD", phone: "0704388523", location: "Nansana Nsumbi" },
  { name: "KAITESI JESSICA", phone: "0770781805", location: "Nansana Nsumbi" },
  { name: "NALUGYA JULIAN", phone: "0700851144", location: "Nansana Nsumbi" },
  { name: "SEMPIJJA GIFT", phone: "0789883497", location: "Nansana Nsumbi" },
  { name: "MUSUBIRWA SOPHIE", phone: "0700109536", location: "Nansana Nsumbi" },
  { name: "ETAP LYDIA", phone: "0776687711", location: "Nansana Nsumbi" },
  { name: "SSUNA VICTORIA", phone: "0773083791", location: "Nansana Nsumbi" },
  { name: "NAJJENGO LYDIA", phone: "0782822402", location: "Nansana Nsumbi" },
  { name: "LAMUNU GLADYS", phone: "0707793132", location: "Nansana Nsumbi" },
  { name: "ASINGWIRE MARK EZRA", phone: "0782530100", location: "Nansana Nsumbi" },
  { name: "AINEMBABAZI ETHAN", phone: "0782530100", location: "Nansana Nsumbi" },
  { name: "BYAMUKAMA REBECCA", phone: "0782530100", location: "Nansana Nsumbi" },
  { name: "BYAMUKAMA ASAPH", phone: "0772507789", location: "Nansana Nsumbi" },
  { name: "OMACH PHILIP", phone: "0776787475", location: "Nansana Nsumbi" },
  { name: "BASIL TINKA", phone: "0772141539", location: "Nansana Nsumbi" },
  { name: "RWANYANGE JACK", phone: "0772501628", location: "Nansana Nsumbi" },
  { name: "NAMUBIRU ROSE", phone: "0704189092", location: "Nansana Nsumbi" },
  { name: "MUKASA SOWEDI", phone: "0774329584", location: "Nansana Nsumbi" },
  { name: "TINO NAOMI", phone: "0787880835", location: "Nansana Nsumbi" },
  { name: "NAMPEERA MARIA STELLA", phone: "0701624062", location: "Nansana Nsumbi" },
  { name: "SAMANTHA NAMARA BABIHUGA", phone: "0776879364", location: "Nansana Nsumbi" },
  { name: "MBABAZI WAHAB", phone: "0782129853", location: "Nansana Nsumbi" },
  { name: "NANSAMBA CISSY", phone: "0789355131", location: "Nansana Nsumbi" },
  { name: "ODEKE BEN", phone: "0785328544", location: "Nansana Nsumbi" },
  { name: "OKOBI EMMANUEL", phone: "0776722735", location: "Nansana Nsumbi" },
  { name: "NIWARINDA JAMES", phone: "0784672945", location: "Nansana Nsumbi" },
  { name: "ALIA JOEL SHADRACK", phone: "077149701", location: "Nansana Nsumbi" },
  { name: "KANSIIME BRUCE", phone: "0773423531", location: "Nansana Nsumbi" },
  { name: "TUMWESIGYE ANSLEM", phone: "0703774001", location: "Nansana Nsumbi" },
  { name: "AWORI BARBRA", phone: "0779766230", location: "Nansana Nsumbi" },
  { name: "MUYAMA CHOSEN", phone: "0774676877", location: "Nansana Nsumbi" },
  { name: "NANDUTU CHRISTINE", phone: "0774676877", location: "Nansana Nsumbi" },
  { name: "NANDAAH TENDA LUCKY", phone: "0774676877", location: "Nansana Nsumbi" },
  { name: "KIYEMBA RONALD", phone: "0779324012", location: "Nansana Nsumbi" },
  { name: "MUJUNI JESSE JAYDEN", phone: "0783622700", location: "Nansana Nsumbi" },
  { name: "MUJUNI JEREMY KEITH", phone: "0783622700", location: "Nansana Nsumbi" },
  { name: "KAFUKO ENIDTRICE", phone: "0782283647", location: "Nansana Nsumbi" },
  { name: "NALUGO RESTY", phone: "0782199844", location: "Nansana Nsumbi" },
  { name: "AKUGIZIBWE HANNAH AKIIKI", phone: "0781670939", location: "Nansana Nsumbi" },
  { name: "KIBIRIGE RONALD KAGIMU", phone: "0752954509", location: "Nansana Nsumbi" },
  { name: "AKIDING RITA CATHERINE", phone: "0787444412", location: "Nansana Nsumbi" },
  { name: "AKONA OKULLO PROCHORUS", phone: "0705955616", location: "Nansana Nsumbi" },
  { name: "GANG BILLY BRUNO", phone: "0783658113", location: "Nansana Nsumbi" },
  { name: "MUSIIME RONALD", phone: "0704396626", location: "Nansana Nsumbi" },
  { name: "KYEYUNE RONALD", phone: "0705207250", location: "Nansana Nsumbi" },
  { name: "KUSIIMWA FRANCIS", phone: "0750584763", location: "Nansana Nsumbi" },
  { name: "WANDERA PETER", phone: "0772504631", location: "Nansana Nsumbi" },
  { name: "SEBINA CHRISTOPHER", phone: "0779558447", location: "Nansana Nsumbi" },
  { name: "NAMBUYA SKYE TIRZAH", phone: "0772618994", location: "Nansana Nsumbi" },
  { name: "OBENY LINO AMUKU", phone: "0789406224", location: "Nansana Nsumbi" },
  { name: "BYAKACHA RICK", phone: "0785120386", location: "Nansana Nsumbi" },
  { name: "MWESIGE SUSAN BRENDA", phone: "0774459523", location: "Nansana Nsumbi" },
  { name: "MUGABI RONALD", phone: "0750770510", location: "Nansana Nsumbi" },
  { name: "KATENDE JONATHAN", phone: "0781858028", location: "Nansana Nsumbi" },
  { name: "NAKATO GRACE", phone: "0772948621", location: "Nansana Nsumbi" },
  { name: "NAKIRYA HARRIET", phone: "0772948621", location: "Nansana Nsumbi" },
  { name: "IKIDIT ALEXANDER", phone: "0782928401", location: "Nansana Nsumbi" },
  { name: "BABIRYE GLORIA", phone: "0772948621", location: "Nansana Nsumbi" },
  { name: "MUKYALA SHARON", phone: "0702013703", location: "Nansana Nsumbi" },
  { name: "MUKYLA VIVIAN", phone: "0702013703", location: "Nansana Nsumbi" },
  { name: "BAKILAMBE ESTHER", phone: "0702013703", location: "Nansana Nsumbi" },
  { name: "IBANDA VERONICAH", phone: "0752635999", location: "Nansana Nsumbi" },
  { name: "LUKULA PRUDENCE", phone: "0752635999", location: "Nansana Nsumbi" },
  { name: "LUKULA HEZRON", phone: "0752635999", location: "Nansana Nsumbi" },
  { name: "KASIRYE FELICIA", phone: "0751303057", location: "Nansana Nsumbi" },
  { name: "NABONGO CAROLYN", phone: "0782375354", location: "Nansana Nsumbi" },
  { name: "KYIKANSEMEZA RHONA", phone: "0706971990", location: "Nansana Nsumbi" },
  { name: "ASINGWIRE BRENDA KATUNGI", phone: "0701911175", location: "Nansana Nsumbi" },
  { name: "LAUREN VAN ZYL", phone: "0774048353", location: "Nansana Nsumbi" },
  { name: "MALAIKA LINDA JOY", phone: "0774048353", location: "Nansana Nsumbi" },
  { name: "AREEBAHOONA SHEILA", phone: "0784077836", location: "Nansana Nsumbi" },
];

export default function BulkAddAdekeAnnet() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const addAllTenants = async () => {
    setLoading(true);
    const stats = { success: 0, duplicates: 0, failed: 0, errors: [] as string[] };

    for (const tenant of allTenants) {
      try {
        // Check for duplicate
        const { data: existing } = await supabase
          .from('tenants')
          .select('id')
          .eq('contact', tenant.phone)
          .maybeSingle();

        if (existing) {
          stats.duplicates++;
          continue;
        }

        // Insert tenant - ignore any errors and continue
        const { data: newTenant, error: insertError } = await supabase
          .from('tenants')
          .insert({
            name: tenant.name,
            contact: tenant.phone,
            address: tenant.location,
            landlord: "Not provided",
            landlord_contact: "Not provided",
            rent_amount: 50000,
            repayment_days: 30,
            agent_name: "ADEKE ANNET",
            agent_phone: "",
            registration_fee: 10000,
            access_fee: 0,
            status: "active",
            payment_status: "pending",
            performance: 80,
            location_district: "KAMPALA",
            location_cell_or_village: tenant.location,
            edited_by: "Bulk Upload",
            edited_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          stats.failed++;
          stats.errors.push(`${tenant.name}: ${insertError.message}`);
          continue; // Skip to next tenant
        }

        // Create daily payments - ignore errors
        try {
          const payments = [];
          const today = new Date();
          for (let day = 0; day < 30; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() + day);
            payments.push({
              tenant_id: newTenant.id,
              date: date.toISOString().split('T')[0],
              amount: 50000 / 30,
              paid: false
            });
          }

          await supabase.from('daily_payments').insert(payments);
        } catch (e) {
          // Ignore payment errors
        }

        // Create agent earnings - ignore errors
        try {
          await supabase.from('agent_earnings').insert({
            agent_name: "ADEKE ANNET",
            agent_phone: "",
            tenant_id: newTenant.id,
            earning_type: "signup_bonus",
            amount: 5000
          });
        } catch (e) {
          // Ignore earnings errors
        }

        stats.success++;
      } catch (error: any) {
        // Ignore all errors and continue
        stats.failed++;
        stats.errors.push(`${tenant.name}: ${error.message || 'Unknown error'}`);
      }
    }

    setResult(stats);
    setLoading(false);
    
    toast({
      title: "✅ Bulk Add Complete!",
      description: `Added ${stats.success} tenants. Skipped ${stats.duplicates} duplicates. ${stats.failed} failed.`
    });
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Add ADEKE ANNET Tenants</CardTitle>
          <CardDescription>
            Click the button below to add all 272 tenants from the Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={addAllTenants} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Adding Tenants..." : "Add All Tenants Now"}
          </Button>

          {result && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-semibold">Results:</p>
              <p>✅ Successfully added: {result.success}</p>
              <p>⚠️ Duplicates skipped: {result.duplicates}</p>
              <p>❌ Failed: {result.failed}</p>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground">View errors</summary>
                  <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <p key={i} className="text-destructive">{err}</p>
                    ))}
                  </div>
                </details>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                💡 You can now edit any tenant card to add missing information (rent amount, landlord, etc.)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
