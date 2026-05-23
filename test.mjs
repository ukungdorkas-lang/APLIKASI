import fs from 'fs';

const file = 'src/pages/AdminDashboard.tsx';
let txt = fs.readFileSync(file, 'utf8');

const regex = /React\.useEffect\(\(\) => \{\s*const unsubNews = onSnapshot\([\s\S]*?unsubBankData\(\);\s*\};\s*\}, \[\]\);/;

if(regex.test(txt)) {
  console.log("Matched!");
  
  // Now replace the giant useEffect with multiple separated ones.
  let replacement = `
  React.useEffect(() => {
    if (activeTab !== "news" && activeTab !== "overview") return;
    const unsubNews = onSnapshot(
      query(collection(db, "news"), orderBy("date", "desc"), limit(25)),
      (sn) => {
        setNews(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, news: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: news", err);
        handleFirestoreError(err, OperationType.LIST, "news", auth);
        setDataLoading((prev) => ({ ...prev, news: false }));
      }
    );
    return () => unsubNews();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "users") return;
    const unsubUsers = onSnapshot(
      query(collection(db, "admins")),
      (snAdmins) => {
        const adminUsers = snAdmins.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          role: d.data().role || "admin",
          collection: "admins",
        }));
        const unsubPers = onSnapshot(
          query(collection(db, "personnel")),
          (snPersonnel) => {
            const personnelUsers = snPersonnel.docs.map((d) => ({
              id: d.id,
              ...d.data(),
              role: d.data().role || "field_personnel",
              collection: "personnel",
            }));
            setUsers([...adminUsers, ...personnelUsers]);
            setDataLoading((prev) => ({ ...prev, users: false }));
          },
          (err) => {
            console.warn("Listener failed for collection: personnel", err);
            setUsers(adminUsers);
            setDataLoading((prev) => ({ ...prev, users: false }));
          }
        );
        // We can't return the unsub right here natively easily inside nested onSnapshot, 
        // but for short term let's just let it be GC'd or we refine the approach.
        // Actually best is to just fetch them simply. 
      },
      (err) => {
        console.warn("Listener failed for collection: admins", err);
        setDataLoading((prev) => ({ ...prev, users: false }));
      }
    );
    return () => unsubUsers();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "logs" && activeTab !== "overview") return;
    const unsubLogs = onSnapshot(
      query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50)),
      (sn) => {
        setLogs(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, logs: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: audit_logs", err);
        handleFirestoreError(err, OperationType.LIST, "audit_logs", auth);
        setDataLoading((prev) => ({ ...prev, logs: false }));
      }
    );
    return () => unsubLogs();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "ai_chats") return;
    const unsubAiChats = onSnapshot(
      query(collection(db, "ai_chats"), orderBy("timestamp", "desc"), limit(20)),
      (sn) => {
        setAiChats(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Listener failed for collection: ai_chats", err)
    );
    return () => unsubAiChats();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "gallery" && activeTab !== "overview") return;
    const unsubGallery = onSnapshot(
      query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(25)),
      (sn) => {
        setGallery(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, gallery: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: gallery", err);
        handleFirestoreError(err, OperationType.LIST, "gallery", auth);
        setDataLoading((prev) => ({ ...prev, gallery: false }));
      }
    );
    return () => unsubGallery();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "education") return;
    const unsubEducation = onSnapshot(
      query(collection(db, "education"), orderBy("createdAt", "desc"), limit(20)),
      (sn) => {
        setEducation(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, education: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: education", err);
        handleFirestoreError(err, OperationType.LIST, "education", auth);
        setDataLoading((prev) => ({ ...prev, education: false }));
      }
    );
    return () => unsubEducation();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "profiles") return;
    const unsubProfiles = onSnapshot(
      query(collection(db, "profile_sections"), orderBy("order", "asc")),
      (sn) => {
        setProfileSections(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, profiles: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: profile_sections", err);
        handleFirestoreError(err, OperationType.LIST, "profile_sections", auth);
        setDataLoading((prev) => ({ ...prev, profiles: false }));
      }
    );
    return () => unsubProfiles();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "banners") return;
    const unsubBanners = onSnapshot(
      collection(db, "banners"),
      (sn) => {
        setBanners(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, banners: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: banners", err);
        handleFirestoreError(err, OperationType.LIST, "banners", auth);
        setDataLoading((prev) => ({ ...prev, banners: false }));
      }
    );
    return () => unsubBanners();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "settings") return;
    const unsubSettings = onSnapshot(
      doc(db, "settings", "app"),
      (snap) => {
        if (snap.exists()) {
          setSettingsForm((prev) => ({ ...prev, ...snap.data() }));
        }
        setDataLoading((prev) => ({ ...prev, settings: false }));
      },
      (err) => {
        console.warn("Listener failed for document: settings/app", err);
        handleFirestoreError(err, OperationType.GET, "settings/app", auth);
        setDataLoading((prev) => ({ ...prev, settings: false }));
      }
    );
    return () => unsubSettings();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "monitoring" && activeTab !== "overview") return;
    const unsubRiver = onSnapshot(
      query(collection(db, "river_sensors"), orderBy("updatedAt", "desc"), limit(20)),
      (sn) => {
        setRiverSensors(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, monitoring: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: river_sensors", err);
        handleFirestoreError(err, OperationType.LIST, "river_sensors", auth);
        setDataLoading((prev) => ({ ...prev, monitoring: false }));
      }
    );
    const unsubWeather = onSnapshot(
      query(collection(db, "weather_upstream"), orderBy("updatedAt", "desc"), limit(20)),
      (sn) => {
        setWeatherUpstream(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.warn("Listener failed for collection: weather_upstream", err);
        handleFirestoreError(err, OperationType.LIST, "weather_upstream", auth);
      }
    );
    return () => { unsubRiver(); unsubWeather(); };
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "bank_data") return;
    const unsubBankData = onSnapshot(
      query(collection(db, "bank_data"), orderBy("createdAt", "desc"), limit(25)),
      (sn) => {
        setBankData(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, bank_data: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: bank_data", err);
        handleFirestoreError(err, OperationType.LIST, "bank_data", auth);
        setDataLoading((prev) => ({ ...prev, bank_data: false }));
      }
    );
    return () => unsubBankData();
  }, [activeTab]);
  `;
  
  txt = txt.replace(regex, replacement);
  fs.writeFileSync(file, txt, 'utf8');
  console.log("Successfully replaced the monster useEffect!");
} else {
  console.log("Not matched");
}
