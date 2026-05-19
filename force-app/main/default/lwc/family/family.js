import { LightningElement, track, wire } from 'lwc';
import searchFamily from '@salesforce/apex/Familyservice.searchFamily';
import createFamilyWithHead from '@salesforce/apex/Familyservice.createFamilyWithHead';
import deleteFamily from '@salesforce/apex/Familyservice.deleteFamily';
import updateFamily from '@salesforce/apex/Familyservice.updateFamily'; import getFamilyMembers from '@salesforce/apex/Familyservice.getFamilyMembers';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class FamilyDashboard extends LightningElement {

    @track families = [];
    searchKey = '';

    @track memberOptions = [];
    selectedHeadId;

    showModal = false;
    showEditModal = false;
    isLoading = false;

    familyName;

    memberName;
    address;
    age;
    phone;
    selectedFamilyId;
    showMembers = false;

    showDeleteModal = false;
    deleteRecordId;

    selectedRows = [];

    wiredResult;

    //  COLUMNS (View button + Dropdown BOTH)
    columns = [
        { label: 'Family Name', fieldName: 'Name' },
        { label: 'Head of Family', fieldName: 'headName' },

        //  View Members button 
        {
            label: 'View Members',
            type: 'button',
            typeAttributes: {
                label: 'View Members',
                name: 'view_members',
                variant: 'brand',
                iconName: 'utility:new_window', 
                iconPosition: 'left'
            }
        },

        //  Dropdown (Edit/Delete)
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit', name: 'edit' },
                    { label: 'Delete', name: 'delete' }
                ]
            }
        }
    ];

    //  DATA LOAD
    @wire(searchFamily, { searchKey: '$searchKey' })
    wiredFamilies(result) {
        this.wiredResult = result;

        if (result.data) {
            this.families = result.data.map(fam => {
                return {
                    ...fam,
                    headName: fam.Head_of_Family__r
                        ? fam.Head_of_Family__r.Name
                        : 'N/A'
                };
            });
        } else if (result.error) {
            console.error(result.error);
        }
    }

    //  SEARCH
    handleSearch(event) {
        this.searchKey = event.target.value;
    }

    // ALL BUTTON HANDLING
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        console.log('ACTION:', actionName);
        console.log('ROW ID:', row.Id);


        //  VIEW MEMBERS (IMPORTANT)
        if (actionName === 'view_members') {
            this.selectedFamilyId = row.Id;
            this.showMembers = true;
        }

        //  DELETE
        else if (actionName === 'delete') {
            this.deleteRecordId = row.Id;
            this.familyName = row.Name;
            this.showDeleteModal = true;
        }

        else if (actionName === 'edit') {

    this.selectedFamilyId = row.Id;

    this.familyName = row.Name;

    this.selectedHeadId = row.Head_of_Family__c;

    //  Load members of same family
    getFamilyMembers({ familyId: row.Id })

    .then(result => {

        this.memberOptions = result.map(member => {

            return {
                label: member.Name,
                value: member.Id
            };
        });

        // modal AFTER loading options
        this.showEditModal = true;
    })

    .catch(error => {

        console.error(error);

        this.memberOptions = [];

        this.showToast(
            'Error',
            'Error loading family members',
            'error'
        );
    });
}
    }

    //  DELETE CONFIRM
    confirmDelete() {
        deleteFamily({ familyId: this.deleteRecordId })
        .then(() => {
            this.showToast('Success', 'Family deleted', 'success');
            this.showDeleteModal = false;
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error deleting family', 'error');
        });
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    //  MODALS
    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    handleFamilyName(e) {
        this.familyName = e.target.value;
    }
    handleMemberName(event) {
    this.memberName = event.target.value;
    }

    handleAddress(event) {
        this.address = event.target.value;
    }

    handleAge(event) {
        this.age = event.target.value;
    }

    handlePhone(event) {
        this.phone = event.target.value;
    }
    handleHeadChange(event) {

    this.selectedHeadId = event.detail.value;
    }

    handleRowSelection(event) {

    this.selectedRows = event.detail.selectedRows;
}
    
handleBulkDelete() {

    if(this.selectedRows.length === 0) {

        this.showToast(
            'Error',
            'Please select at least one family',
            'error'
        );

        return;
    }

    const ids = this.selectedRows.map(row => row.Id);

    Promise.all(
        ids.map(id => deleteFamily({ familyId: id }))
    )

    .then(() => {

        this.showToast(
            'Success',
            'Selected families deleted',
            'success'
        );

        this.selectedRows = [];

        return refreshApex(this.wiredResult);
    })

    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            'Error deleting families',
            'error'
        );
    });
}
    //  CREATE FAMILY
    saveFamily() {
        if (!this.familyName) {
            this.showToast('Error', 'Family Name is required', 'error');
            return;
        }

        if (!/^[0-9]{10}$/.test(this.phone)) {

        this.showToast(
            'Error',
            'Phone number must contain exactly 10 digits',
            'error'
        );

        return;
    }

        createFamilyWithHead({

    familyName: this.familyName,
    memberName: this.memberName,
    address: this.address,
    age: this.age,
    phone: this.phone
})
        .then(() => {
            this.showToast('Success', 'Family Created', 'success');
            this.showModal = false;
            this.familyName = '';
            this.memberName = '';
            this.address = '';
            this.age = '';
            this.phone = '';
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error creating family', 'error');
        });
    }

    //  UPDATE FAMILY
    updateFamilyHandler() {
        console.log('HEAD ID BEFORE UPDATE:', this.selectedHeadId);

        updateFamily({
            familyId: this.selectedFamilyId,
            familyName: this.familyName,
            headId: this.selectedHeadId
        })
        .then(() => {
            this.showToast('Success', 'Family updated', 'success');
            this.showEditModal = false;
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error updating family', 'error');
        });
    }

    //  BACK
    handleBack() {
        this.showMembers = false;
        this.selectedFamilyId = null;
    }

    //  TOAST
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}