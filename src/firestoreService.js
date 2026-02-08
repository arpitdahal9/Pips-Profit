import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

const tradesCollection = (userId) => collection(db, "users", userId, "trades");
const accountsCollection = (userId) => collection(db, "users", userId, "accounts");
const strategiesCollection = (userId) => collection(db, "users", userId, "strategies");
const tagsCollection = (userId) => collection(db, "users", userId, "tags");
const settingsDoc = (userId) => doc(db, "users", userId, "settings", "main");
const profileDoc = (userId) => doc(db, "users", userId, "profile", "main");

const stripUndefined = (data) => {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
};

const normalizeTradePayload = (tradeData, userId) => {
  return stripUndefined({
    ...tradeData,
    userId,
    timestamp: tradeData.timestamp || serverTimestamp()
  });
};

export const saveTrade = async (userId, tradeData) => {
  console.log('Saving trade to Firestore', userId, tradeData);
  const tradeId = tradeData.id || `trade_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = normalizeTradePayload(tradeData, userId);
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  await setDoc(tradeRef, payload, { merge: true });
  return { id: tradeId, ...payload };
};

export const updateTrade = async (userId, tradeId, updates) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  await updateDoc(
    tradeRef,
    stripUndefined({ ...updates, updatedAt: serverTimestamp() })
  );
};

export const deleteTrade = async (userId, tradeId) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  await deleteDoc(tradeRef);
};

export const subscribeToTrades = (userId, callback) => {
  const tradesQuery = query(tradesCollection(userId), orderBy("timestamp", "desc"));
  return onSnapshot(tradesQuery, { includeMetadataChanges: true }, (snapshot) => {
    const trades = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback({
      trades,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      fromCache: snapshot.metadata.fromCache
    });
  });
};

export const uploadLocalTrades = async (userId, localTrades = []) => {
  if (!localTrades.length) return [];
  const uploaded = [];
  const chunkSize = 400;
  for (let i = 0; i < localTrades.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = localTrades.slice(i, i + chunkSize);
    chunk.forEach((trade) => {
      const tradeId = trade.id || `trade_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tradeRef = doc(db, "users", userId, "trades", tradeId);
      const payload = normalizeTradePayload({
        ...trade,
        migratedAt: serverTimestamp()
      }, userId);
      batch.set(tradeRef, payload, { merge: true });
      uploaded.push({ id: tradeId, ...payload });
    });
    await batch.commit();
  }
  return uploaded;
};

export const saveAccount = async (userId, accountData) => {
  const accountId = accountData.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = stripUndefined({ ...accountData, userId });
  const accountRef = doc(db, "users", userId, "accounts", accountId);
  await setDoc(accountRef, payload, { merge: true });
  return { id: accountId, ...payload };
};

export const updateAccount = async (userId, accountId, updates) => {
  const accountRef = doc(db, "users", userId, "accounts", accountId);
  await updateDoc(accountRef, stripUndefined({ ...updates, updatedAt: serverTimestamp() }));
};

export const deleteAccount = async (userId, accountId) => {
  const accountRef = doc(db, "users", userId, "accounts", accountId);
  await deleteDoc(accountRef);
};

export const subscribeToAccounts = (userId, callback) => {
  return onSnapshot(accountsCollection(userId), (snapshot) => {
    const accounts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(accounts);
  });
};

export const uploadLocalAccounts = async (userId, localAccounts = []) => {
  if (!localAccounts.length) return [];
  const uploaded = [];
  const chunkSize = 400;
  for (let i = 0; i < localAccounts.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = localAccounts.slice(i, i + chunkSize);
    chunk.forEach((account) => {
      const accountId = account.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const accountRef = doc(db, "users", userId, "accounts", accountId);
      const payload = stripUndefined({ ...account, userId, migratedAt: serverTimestamp() });
      batch.set(accountRef, payload, { merge: true });
      uploaded.push({ id: accountId, ...payload });
    });
    await batch.commit();
  }
  return uploaded;
};

export const saveStrategy = async (userId, strategyData) => {
  const strategyId = strategyData.id || `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = stripUndefined({ ...strategyData, userId });
  const strategyRef = doc(db, "users", userId, "strategies", strategyId);
  await setDoc(strategyRef, payload, { merge: true });
  return { id: strategyId, ...payload };
};

export const updateStrategy = async (userId, strategyId, updates) => {
  const strategyRef = doc(db, "users", userId, "strategies", strategyId);
  await updateDoc(strategyRef, stripUndefined({ ...updates, updatedAt: serverTimestamp() }));
};

export const deleteStrategy = async (userId, strategyId) => {
  const strategyRef = doc(db, "users", userId, "strategies", strategyId);
  await deleteDoc(strategyRef);
};

export const subscribeToStrategies = (userId, callback) => {
  return onSnapshot(strategiesCollection(userId), (snapshot) => {
    const strategies = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(strategies);
  });
};

export const uploadLocalStrategies = async (userId, localStrategies = []) => {
  if (!localStrategies.length) return [];
  const uploaded = [];
  const chunkSize = 400;
  for (let i = 0; i < localStrategies.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = localStrategies.slice(i, i + chunkSize);
    chunk.forEach((strategy) => {
      const strategyId = strategy.id || `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const strategyRef = doc(db, "users", userId, "strategies", strategyId);
      const payload = stripUndefined({ ...strategy, userId, migratedAt: serverTimestamp() });
      batch.set(strategyRef, payload, { merge: true });
      uploaded.push({ id: strategyId, ...payload });
    });
    await batch.commit();
  }
  return uploaded;
};

export const saveTag = async (userId, tagData) => {
  const tagId = tagData.id || `tag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = stripUndefined({ ...tagData, userId });
  const tagRef = doc(db, "users", userId, "tags", tagId);
  await setDoc(tagRef, payload, { merge: true });
  return { id: tagId, ...payload };
};

export const deleteTag = async (userId, tagId) => {
  const tagRef = doc(db, "users", userId, "tags", tagId);
  await deleteDoc(tagRef);
};

export const subscribeToTags = (userId, callback) => {
  return onSnapshot(tagsCollection(userId), (snapshot) => {
    const tags = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(tags);
  });
};

export const uploadLocalTags = async (userId, localTags = []) => {
  if (!localTags.length) return [];
  const uploaded = [];
  const chunkSize = 400;
  for (let i = 0; i < localTags.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = localTags.slice(i, i + chunkSize);
    chunk.forEach((tag) => {
      const tagId = tag.id || `tag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tagRef = doc(db, "users", userId, "tags", tagId);
      const payload = stripUndefined({ ...tag, userId, migratedAt: serverTimestamp() });
      batch.set(tagRef, payload, { merge: true });
      uploaded.push({ id: tagId, ...payload });
    });
    await batch.commit();
  }
  return uploaded;
};

export const saveSettings = async (userId, settingsData) => {
  await setDoc(settingsDoc(userId), stripUndefined({ ...settingsData, updatedAt: serverTimestamp() }), { merge: true });
};

export const subscribeToSettings = (userId, callback) => {
  return onSnapshot(settingsDoc(userId), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
};

export const saveProfile = async (userId, profileData) => {
  await setDoc(profileDoc(userId), stripUndefined({ ...profileData, updatedAt: serverTimestamp() }), { merge: true });
};

export const subscribeToProfile = (userId, callback) => {
  return onSnapshot(profileDoc(userId), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
};
