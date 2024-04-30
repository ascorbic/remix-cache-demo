////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Remix, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

// @ts-ignore - no types, but it's a tiny function
import { getDeployStore } from "@netlify/blobs";
import { matchSorter } from "match-sorter";
import sortBy from "sort-by";
import invariant from "tiny-invariant";

type ContactMutation = {
  id?: string;
  first?: string;
  last?: string;
  avatar?: string;

  twitter?: string;
  notes?: string;
  favorite?: boolean;
};

export type ContactRecord = ContactMutation & {
  id: string;
  createdAt: string;
};

////////////////////////////////////////////////////////////////////////////////
// This is just a fake DB table. In a real app you'd be talking to a real db or
// fetching from an existing API.
const fakeContacts = {
  records: {} as Record<string, ContactRecord>,

  async getAll(): Promise<ContactRecord[]> {
    const blobStore = getDeployStore();
    const { blobs } = await blobStore.list();
    console.log(blobs);

    return (
      await Promise.all(
        blobs.map(({ key }) => {
          return blobStore.get(key, { type: "json" });
        })
      )
    ).sort(sortBy("-createdAt", "last"));
  },

  async get(id: string): Promise<ContactRecord | null> {
    const blobStore = getDeployStore();
    return blobStore.get(id, { type: "json" }) || null;
  },

  async create(values: ContactMutation): Promise<ContactRecord> {
    const blobStore = getDeployStore();
    const id =
      values.id ||
      `${values.first?.toLowerCase()}-${values.last?.toLocaleLowerCase()}`;
    const createdAt = new Date().toISOString();
    const newContact = { id, createdAt, ...values };
    await blobStore.setJSON(id, newContact);
    return newContact;
  },

  async set(id: string, values: ContactMutation): Promise<ContactRecord> {
    const blobStore = getDeployStore();
    const contact = await blobStore.get(id, { type: "json" });
    invariant(contact, `No contact found for ${id}`);
    const updatedContact = { ...contact, ...values };
    await blobStore.setJSON(id, updatedContact);
    return updatedContact;
  },

  async destroy(id: string): Promise<null> {
    const blobStore = getDeployStore();
    await blobStore.delete(id);
    return null;
  },
};

////////////////////////////////////////////////////////////////////////////////
// Handful of helper functions to be called from route loaders and actions
export async function getContacts(query?: string | null) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  let contacts = await fakeContacts.getAll();
  if (query) {
    contacts = matchSorter(contacts, query, {
      keys: ["first", "last"],
    });
  }
  return contacts.sort(sortBy("last", "createdAt"));
}

export async function createEmptyContact() {
  const contact = await fakeContacts.create({});
  return contact;
}

export async function getContact(id: string) {
  return fakeContacts.get(id);
}

export async function updateContact(id: string, updates: ContactMutation) {
  const contact = await fakeContacts.get(id);
  if (!contact) {
    throw new Error(`No contact found for ${id}`);
  }
  await fakeContacts.set(id, { ...contact, ...updates });
  return contact;
}

export async function deleteContact(id: string) {
  fakeContacts.destroy(id);
}
